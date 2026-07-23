/*! FabUI Scheduler browser global | Optional extension; load FabUI core first */
(function(global) {
'use strict';
if (!global.fabui || !global.fabui.Control) {
  throw new Error('FabUI Scheduler requires FabUI core. Load fabui.* first.');
}
var SCHEDULER_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

var SCHEDULER_VIEW_TYPES = [
  'day', 'workWeek', 'week', 'month', 'year', 'agenda', 'timeline'
];

var SCHEDULER_LOCALES = {
  en: {
    today: 'Today',
    previous: 'Previous',
    next: 'Next',
    allDay: 'all day',
    noEvents: 'No events',
    event: 'Event',
    newEvent: 'New event',
    editEvent: 'Edit event',
    title: 'Title',
    description: 'Description',
    start: 'Start',
    end: 'End',
    date: 'Date',
    time: 'Time',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Delete',
    untitled: '(No title)',
    eventRow: 'Events',
    more: '{count} more',
    day: 'Day',
    workWeek: 'Work Week',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    agenda: 'Agenda',
    timeline: 'Timeline',
    invalidRange: 'The end must be later than the start.',
    selectEvent: 'Select {title}',
    resizeEvent: 'Resize {title}',
    editEventAria: 'Edit {title}'
  },
  'zh-TW': {
    today: '今天',
    previous: '上一個',
    next: '下一個',
    allDay: '全天',
    noEvents: '沒有行程',
    event: '行程',
    newEvent: '新增行程',
    editEvent: '編輯行程',
    title: '標題',
    description: '說明',
    start: '開始',
    end: '結束',
    date: '日期',
    time: '時間',
    save: '儲存',
    cancel: '取消',
    remove: '刪除',
    untitled: '（無標題）',
    eventRow: '行程',
    more: '另有 {count} 個',
    day: '日',
    workWeek: '工作週',
    week: '週',
    month: '月',
    year: '年',
    agenda: '議程',
    timeline: '時間軸',
    invalidRange: '結束時間必須晚於開始時間。',
    selectEvent: '選取「{title}」',
    resizeEvent: '調整「{title}」時間',
    editEventAria: '編輯「{title}」'
  },
  'zh-CN': {
    today: '今天',
    previous: '上一个',
    next: '下一个',
    allDay: '全天',
    noEvents: '没有日程',
    event: '日程',
    newEvent: '新增日程',
    editEvent: '编辑日程',
    title: '标题',
    description: '说明',
    start: '开始',
    end: '结束',
    date: '日期',
    time: '时间',
    save: '保存',
    cancel: '取消',
    remove: '删除',
    untitled: '（无标题）',
    eventRow: '日程',
    more: '另有 {count} 个',
    day: '日',
    workWeek: '工作周',
    week: '周',
    month: '月',
    year: '年',
    agenda: '议程',
    timeline: '时间轴',
    invalidRange: '结束时间必须晚于开始时间。',
    selectEvent: '选择“{title}”',
    resizeEvent: '调整“{title}”时间',
    editEventAria: '编辑“{title}”'
  }
};

function schedulerAssign(target) {
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

function resolveSchedulerElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function normalizeSchedulerLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (SCHEDULER_LOCALES[value]) return value;
  if (/^zh-(?:tw|hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:cn|hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) {
    return 'zh-CN';
  }
  return 'en';
}

function normalizeSchedulerTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return SCHEDULER_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function normalizeSchedulerView(value) {
  value = String(value || 'week').trim();
  if (value.toLowerCase() === 'workweek') return 'workWeek';
  value = value.toLowerCase();
  return SCHEDULER_VIEW_TYPES.indexOf(value) >= 0 ? value : 'week';
}

function schedulerDate(value, fallback) {
  var date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!isFinite(date.getTime())) {
    return fallback instanceof Date ? new Date(fallback.getTime()) : new Date();
  }
  return date;
}

function schedulerStartOfDay(value) {
  var date = schedulerDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function schedulerAddDays(value, amount) {
  var date = schedulerDate(value);
  date.setDate(date.getDate() + Number(amount || 0));
  return date;
}

function schedulerAddMinutes(value, amount) {
  return new Date(schedulerDate(value).getTime() + Number(amount || 0) * 60000);
}

function schedulerStartOfWeek(value, firstDay) {
  var date = schedulerStartOfDay(value);
  var delta = (date.getDay() - firstDay + 7) % 7;
  date.setDate(date.getDate() - delta);
  return date;
}

function schedulerStartOfMonth(value) {
  var date = schedulerStartOfDay(value);
  date.setDate(1);
  return date;
}

function schedulerStartOfYear(value) {
  var date = schedulerStartOfDay(value);
  date.setMonth(0, 1);
  return date;
}

function schedulerSameDay(left, right) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function schedulerDateKey(value) {
  var date = schedulerStartOfDay(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function schedulerMinutes(value) {
  return value.getHours() * 60 + value.getMinutes();
}

function schedulerParseTime(value, fallback) {
  var parts;
  var minutes;
  if (typeof value === 'number' && isFinite(value)) {
    return Math.max(0, Math.min(1440, value));
  }
  parts = /^(\d{1,2})(?::(\d{2}))?$/.exec(String(value || ''));
  if (!parts) return fallback;
  minutes = Number(parts[1]) * 60 + Number(parts[2] || 0);
  return Math.max(0, Math.min(1440, minutes));
}

function schedulerFormatTimeInput(value) {
  return String(value.getHours()).padStart(2, '0') + ':' +
    String(value.getMinutes()).padStart(2, '0');
}

function schedulerFormatText(text, values) {
  return String(text || '').replace(/\{([^}]+)\}/g, function(match, key) {
    return values && values[key] != null ? values[key] : match;
  });
}

function schedulerFindTheme(element) {
  var current = resolveSchedulerElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < SCHEDULER_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + SCHEDULER_THEMES[index])) {
        return SCHEDULER_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function schedulerClamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function schedulerEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function schedulerNormalizeViews(views) {
  var result = [];
  (Array.isArray(views) ? views : SCHEDULER_VIEW_TYPES).forEach(function(view) {
    var config = typeof view === 'string' ? { type: view } : schedulerAssign({}, view);
    var type = normalizeSchedulerView(config.type);
    if (!result.some(function(item) { return item.type === type; })) {
      config.type = type;
      result.push(config);
    }
  });
  return result.length ? result : [{ type: 'week' }];
}

function schedulerEventDates(event, fallback) {
  var start = schedulerDate(event && event.start, fallback);
  var end = schedulerDate(event && event.end, schedulerAddMinutes(start, 30));
  if (end.getTime() <= start.getTime()) end = schedulerAddMinutes(start, 30);
  return {
    start: start,
    end: end
  };
}

function schedulerEventOverlaps(event, rangeStart, rangeEnd) {
  var dates = schedulerEventDates(event, rangeStart);
  return dates.start < rangeEnd && dates.end > rangeStart;
}

function schedulerEventColor(event, resources, fallback) {
  var color = event && event.color;
  var index;
  var resource;
  var value;
  var item;
  if (color) return String(color);
  for (index = 0; index < resources.length; index += 1) {
    resource = resources[index] || {};
    value = event && event[resource.field];
    item = (resource.dataSource || []).find(function(candidate) {
      return candidate && candidate.value === value;
    });
    if (item && item.color) return String(item.color);
  }
  return fallback;
}

function schedulerLuminanceColor(color) {
  var match = /^#([0-9a-f]{6})$/i.exec(String(color || ''));
  var red;
  var green;
  var blue;
  if (!match) return '#fff';
  red = parseInt(match[1].slice(0, 2), 16);
  green = parseInt(match[1].slice(2, 4), 16);
  blue = parseInt(match[1].slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160 ? '#111' : '#fff';
}

function schedulerRangeFor(view, date, firstDay) {
  var start;
  var end;
  if (view === 'day' || view === 'timeline') {
    start = schedulerStartOfDay(date);
    end = schedulerAddDays(start, 1);
  } else if (view === 'workWeek') {
    start = schedulerStartOfWeek(date, 1);
    end = schedulerAddDays(start, 5);
  } else if (view === 'week') {
    start = schedulerStartOfWeek(date, firstDay);
    end = schedulerAddDays(start, 7);
  } else if (view === 'month') {
    start = schedulerStartOfWeek(schedulerStartOfMonth(date), firstDay);
    end = schedulerAddDays(start, 42);
  } else if (view === 'year') {
    start = schedulerStartOfYear(date);
    end = new Date(start.getFullYear() + 1, 0, 1);
  } else {
    start = schedulerStartOfDay(date);
    end = schedulerAddDays(start, 7);
  }
  return { start: start, end: end };
}

function schedulerFormatRange(view, range, locale) {
  var localeName = locale === 'zh-TW' ? 'zh-TW' :
    locale === 'zh-CN' ? 'zh-CN' : 'en-US';
  var start = range.start;
  var end = schedulerAddDays(range.end, -1);
  var longDate = new Intl.DateTimeFormat(localeName, {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  });
  var shortDate = new Intl.DateTimeFormat(localeName, {
    month: 'short',
    day: 'numeric'
  });
  if (view === 'year') return String(start.getFullYear());
  if (view === 'month') {
    return new Intl.DateTimeFormat(localeName, {
      year: 'numeric',
      month: 'long'
    }).format(schedulerAddDays(range.start, 10));
  }
  if (schedulerSameDay(start, end)) return longDate.format(start);
  return shortDate.format(start) + ' – ' + shortDate.format(end) +
    (start.getFullYear() === end.getFullYear() ? ', ' + end.getFullYear() : '');
}

function schedulerCreateElement(tagName, className, text) {
  var element = document.createElement(tagName);
  if (className) element.className = className;
  if (text != null) element.textContent = String(text);
  return element;
}

function schedulerGetEventIndex(element) {
  var value = element && element.getAttribute('data-event-index');
  value = value == null ? -1 : Number(value);
  return isFinite(value) ? value : -1;
}

function schedulerLayoutEvents(events) {
  var active = [];
  var maxLanes = 1;
  var lane;
  events.sort(function(left, right) {
    return left.start - right.start || right.end - left.end;
  });
  events.forEach(function(item) {
    active = active.filter(function(candidate) {
      return candidate.end > item.start;
    });
    lane = 0;
    while (active.some(function(candidate) { return candidate.lane === lane; })) {
      lane += 1;
    }
    item.lane = lane;
    active.push(item);
    maxLanes = Math.max(maxLanes, active.length, lane + 1);
    active.forEach(function(candidate) {
      candidate.lanes = Math.max(candidate.lanes || 1, maxLanes);
    });
  });
  events.forEach(function(item) {
    item.lanes = Math.max(item.lanes || 1, maxLanes);
  });
  return events;
}

function schedulerScrollbarWidth(element) {
  if (!element) return 0;
  return Math.max(
    0,
    Number(element.offsetWidth || 0) - Number(element.clientWidth || 0)
  );
}

function createSchedulerFactory(fabui) {
  'use strict';

  var Control = fabui && fabui.Control;
  var registerControl = Control && Control._registerControl;
  var unregisterControl = Control && Control._unregisterControl;
  var Button = fabui && fabui.Button;
  var Window = fabui && fabui.Window;
  var EditBox = fabui && fabui.EditBox;
  var CheckBox = fabui && fabui.CheckBox;
  var schedulerSequence = 0;

  if (typeof Control !== 'function') {
    throw new Error('fabui.Scheduler requires fabui.Control. Load fabui.* first.');
  }
  if (
    typeof Button !== 'function' ||
    typeof Window !== 'function' ||
    typeof EditBox !== 'function' ||
    typeof CheckBox !== 'function'
  ) {
    throw new Error(
      'fabui.Scheduler requires fabui.Button, Window, EditBox, and CheckBox.'
    );
  }

  function Scheduler(element, options) {
    var selectedView;
    if (!(this instanceof Scheduler)) return new Scheduler(element, options);
    this.hostElement = resolveSchedulerElement(element);
    if (!this.hostElement) {
      throw new Error('fabui.Scheduler requires a host element.');
    }
    if (this.hostElement.__fabuiScheduler) {
      return this.hostElement.__fabuiScheduler;
    }
    Control.call(this);
    this._listeners = {};
    this._buttons = [];
    this._viewButtons = {};
    this._editor = null;
    this._interaction = null;
    this._selectedIndex = -1;
    this._destroyed = false;
    this._original = {
      className: this.hostElement.getAttribute('class'),
      style: this.hostElement.getAttribute('style'),
      html: this.hostElement.innerHTML,
      tabIndex: this.hostElement.getAttribute('tabindex'),
      role: this.hostElement.getAttribute('role'),
      ariaLabel: this.hostElement.getAttribute('aria-label')
    };
    this._themeSource = this.hostElement.parentElement || document.body;
    this.options = schedulerAssign({}, Scheduler.defaults, options || {});
    this.options.views = schedulerNormalizeViews(this.options.views);
    this.options.locale = normalizeSchedulerLocale(this.options.locale);
    this.options.date = schedulerDate(this.options.date);
    selectedView = this.options.views.find(function(view) {
      return view.selected === true;
    });
    this.options.currentView = normalizeSchedulerView(
      selectedView ? selectedView.type : this.options.currentView
    );
    if (!this.options.views.some(function(view) {
      return view.type === this.options.currentView;
    }, this)) {
      this.options.currentView = this.options.views[0].type;
    }
    this.options.dataSource = options &&
      Object.prototype.hasOwnProperty.call(options, 'dataSource') &&
      Array.isArray(options.dataSource) ?
      options.dataSource :
      [];
    this.options.slotDuration = Math.max(5, Number(this.options.slotDuration) || 30);
    this.options.slotHeight = Math.max(18, Number(this.options.slotHeight) || 34);
    this._build();
    this._bind();
    this.hostElement.__fabuiScheduler = this;
    if (typeof registerControl === 'function') {
      registerControl(this.hostElement, this);
    }
    this.setTheme(this.options.theme);
    this.setLocale(this.options.locale, this.options.messages);
    this.refresh();
  }

  Scheduler.prototype = Object.create(Control.prototype);
  Scheduler.prototype.constructor = Scheduler;

  Scheduler.prototype._build = function() {
    var host = this.hostElement;
    var toolbar = schedulerCreateElement('div', 'fui-scheduler-toolbar');
    var navigation = schedulerCreateElement('div', 'fui-scheduler-navigation');
    var range = schedulerCreateElement('div', 'fui-scheduler-range');
    var views = schedulerCreateElement('div', 'fui-scheduler-views');
    var content = schedulerCreateElement('div', 'fui-scheduler-content');
    host.textContent = '';
    host.classList.add('fui-scheduler');
    host.tabIndex = host.hasAttribute('tabindex') ? host.tabIndex : 0;
    host.setAttribute('role', 'application');
    host.setAttribute('aria-label', 'Scheduler');
    navigation.setAttribute('role', 'toolbar');
    views.setAttribute('role', 'toolbar');
    toolbar.appendChild(navigation);
    toolbar.appendChild(range);
    toolbar.appendChild(views);
    host.appendChild(toolbar);
    host.appendChild(content);
    this.toolbarElement = toolbar;
    this.navigationElement = navigation;
    this.rangeElement = range;
    this.viewsElement = views;
    this.contentElement = content;
    this._buildToolbar();
    this.resize();
  };

  Scheduler.prototype._createButton = function(container, options, handler) {
    var anchor = schedulerCreateElement('a', options.cls || '');
    var button;
    anchor.href = 'javascript:void(0)';
    container.appendChild(anchor);
    button = new Button(anchor, schedulerAssign({}, options, {
      theme: 'inherit',
      onClick: function() {
        handler();
      }
    }));
    this._buttons.push(button);
    return button;
  };

  Scheduler.prototype._buildToolbar = function() {
    var self = this;
    var group = 'scheduler-view-' + (++schedulerSequence);
    this.navigationElement.textContent = '';
    this.viewsElement.textContent = '';
    this._buttons.forEach(function(button) { button.dispose(); });
    this._buttons = [];
    this._viewButtons = {};
    this._todayButton = this._createButton(this.navigationElement, {
      text: '',
      plain: true,
      cls: 'fui-scheduler-today'
    }, function() {
      self.date(new Date());
    });
    this._previousButton = this._createButton(this.navigationElement, {
      text: '‹',
      plain: true,
      cls: 'fui-scheduler-nav-button'
    }, function() {
      self.navigate('previous');
    });
    this._nextButton = this._createButton(this.navigationElement, {
      text: '›',
      plain: true,
      cls: 'fui-scheduler-nav-button'
    }, function() {
      self.navigate('next');
    });
    this.options.views.forEach(function(view) {
      self._viewButtons[view.type] = self._createButton(self.viewsElement, {
        text: '',
        plain: true,
        toggle: true,
        group: group,
        cls: 'fui-scheduler-view-button'
      }, function() {
        self.view(view.type);
      });
    });
  };

  Scheduler.prototype._bind = function() {
    var self = this;
    this.addEventListener(this.contentElement, 'click', function(event) {
      var eventElement = event.target.closest('[data-event-index]');
      var index;
      if (!eventElement || !self.contentElement.contains(eventElement)) return;
      if (!self.options.selectable) return;
      index = schedulerGetEventIndex(eventElement);
      self.select(index, event);
    });
    this.addEventListener(this.contentElement, 'dblclick', function(event) {
      var eventElement = event.target.closest('[data-event-index]');
      var slot = event.target.closest('[data-scheduler-date]');
      var date;
      if (eventElement) {
        event.preventDefault();
        self.openEditor(schedulerGetEventIndex(eventElement));
        return;
      }
      if (!self.options.editable || !slot) return;
      date = self._dateFromSlot(slot, event);
      self.openEditor({
        start: date,
        end: schedulerAddMinutes(date, self.options.slotDuration),
        isAllDay: slot.hasAttribute('data-all-day')
      });
    });
    this.addEventListener(this.contentElement, 'pointerdown', function(event) {
      self._beginEventInteraction(event);
    });
    this.addEventListener(this.hostElement, 'keydown', function(event) {
      var target = event.target;
      if (
        target &&
        /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName) &&
        target !== self.hostElement
      ) {
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') &&
          self.options.editable &&
          self._selectedIndex >= 0) {
        event.preventDefault();
        self.removeEvent(self._selectedIndex);
      } else if (event.key === 'Enter' && self._selectedIndex >= 0) {
        event.preventDefault();
        self.openEditor(self._selectedIndex);
      } else if (event.key === 'ArrowLeft' && (event.altKey || event.metaKey)) {
        event.preventDefault();
        self.navigate('previous');
      } else if (event.key === 'ArrowRight' && (event.altKey || event.metaKey)) {
        event.preventDefault();
        self.navigate('next');
      }
    });
  };

  Scheduler.prototype._message = function(key, values) {
    return schedulerFormatText(
      (this.messages && this.messages[key]) ||
      SCHEDULER_LOCALES.en[key] ||
      key,
      values
    );
  };

  Scheduler.prototype._fire = function(name, detail) {
    var lower = String(name || '').toLowerCase();
    var callback = this.options['on' + name];
    var listeners = (this._listeners[lower] || []).slice();
    var args = schedulerAssign({
      scheduler: this,
      type: lower
    }, detail || {});
    var allowed = true;
    if (typeof callback === 'function' &&
        callback.call(this.hostElement, this, args) === false) {
      allowed = false;
    }
    listeners.forEach(function(listener) {
      if (listener.call(this, args) === false) allowed = false;
    }, this);
    return allowed;
  };

  Scheduler.prototype._formatDate = function(date, options) {
    var locale = this.options.locale === 'zh-TW' ? 'zh-TW' :
      this.options.locale === 'zh-CN' ? 'zh-CN' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  Scheduler.prototype._viewRange = function() {
    return schedulerRangeFor(
      this.options.currentView,
      this.options.date,
      Number(this.options.firstDay) || 0
    );
  };

  Scheduler.prototype._eventItems = function(range) {
    var fallback = this.options.date;
    return this.options.dataSource.map(function(event, index) {
      var dates = schedulerEventDates(event, fallback);
      return {
        event: event,
        index: index,
        start: dates.start,
        end: dates.end
      };
    }).filter(function(item) {
      return item.start < range.end && item.end > range.start;
    }).sort(function(left, right) {
      return left.start - right.start || left.end - right.end;
    });
  };

  Scheduler.prototype._renderToolbar = function(range) {
    var self = this;
    this._todayButton.setText(this._message('today'));
    this._previousButton.hostElement.title = this._message('previous');
    this._previousButton.hostElement.setAttribute('aria-label', this._message('previous'));
    this._nextButton.hostElement.title = this._message('next');
    this._nextButton.hostElement.setAttribute('aria-label', this._message('next'));
    this.rangeElement.textContent = schedulerFormatRange(
      this.options.currentView,
      range,
      this.options.locale
    );
    this.options.views.forEach(function(view) {
      var button = self._viewButtons[view.type];
      if (!button) return;
      button.setText(self._message(view.title || view.type));
      if (view.type === self.options.currentView) button.select(true);
      else button._setSelected(false, true);
    });
  };

  Scheduler.prototype._renderEmpty = function() {
    var empty = schedulerCreateElement(
      'div',
      'fui-scheduler-empty',
      this._message('noEvents')
    );
    this.contentElement.appendChild(empty);
  };

  Scheduler.prototype._createEventElement = function(item, className, compact) {
    var element = schedulerCreateElement(
      'div',
      'fui-scheduler-event ' + (className || '')
    );
    var title = item.event.title || this._message('untitled');
    var color = schedulerEventColor(
      item.event,
      this.options.resources || [],
      this.options.eventColor
    );
    var time = schedulerCreateElement(
      'span',
      'fui-scheduler-event-time',
      this._formatDate(item.start, {
        hour: '2-digit',
        minute: '2-digit'
      })
    );
    var titleElement = schedulerCreateElement(
      'span',
      'fui-scheduler-event-title',
      title
    );
    element.setAttribute('data-event-index', item.index);
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute(
      'aria-label',
      this._message('selectEvent', { title: title })
    );
    element.style.setProperty('--fui-scheduler-event-color', color);
    element.style.setProperty(
      '--fui-scheduler-event-text',
      schedulerLuminanceColor(color)
    );
    if (!compact && item.event.isAllDay !== true) element.appendChild(time);
    element.appendChild(titleElement);
    if (this.options.editable && !compact) {
      var handle = schedulerCreateElement('span', 'fui-scheduler-resize-handle');
      handle.setAttribute('data-resize-event', '');
      handle.setAttribute(
        'aria-label',
        this._message('resizeEvent', { title: title })
      );
      element.appendChild(handle);
    }
    if (this._selectedIndex === item.index) {
      element.classList.add('fui-scheduler-event-selected');
      element.setAttribute('aria-selected', 'true');
    }
    return element;
  };

  Scheduler.prototype._renderTimeView = function(range) {
    var self = this;
    var dates = [];
    var header = schedulerCreateElement('div', 'fui-scheduler-time-header');
    var allDay = schedulerCreateElement('div', 'fui-scheduler-all-day');
    var scroll = schedulerCreateElement('div', 'fui-scheduler-time-scroll');
    var timeAxis = schedulerCreateElement('div', 'fui-scheduler-time-axis');
    var columns = schedulerCreateElement('div', 'fui-scheduler-time-columns');
    var startMinutes = schedulerParseTime(this.options.startTime, 7 * 60);
    var endMinutes = schedulerParseTime(this.options.endTime, 24 * 60);
    var slotDuration = this.options.slotDuration;
    var slotHeight = this.options.slotHeight;
    var totalMinutes;
    var rangeItems = this._eventItems(range);
    var current = schedulerDate(range.start);
    var minute;
    var row;
    var scrollbarWidth;
    if (endMinutes <= startMinutes) endMinutes = 24 * 60;
    totalMinutes = endMinutes - startMinutes;
    while (current < range.end) {
      dates.push(schedulerDate(current));
      current = schedulerAddDays(current, 1);
    }
    header.style.setProperty('--fui-scheduler-day-count', dates.length);
    allDay.style.setProperty('--fui-scheduler-day-count', dates.length);
    columns.style.setProperty('--fui-scheduler-day-count', dates.length);
    header.appendChild(schedulerCreateElement('div', 'fui-scheduler-time-corner'));
    dates.forEach(function(date) {
      var cell = schedulerCreateElement(
        'div',
        'fui-scheduler-day-heading',
        self._formatDate(date, {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        })
      );
      if (schedulerSameDay(date, new Date())) {
        cell.classList.add('fui-scheduler-today-heading');
      }
      header.appendChild(cell);
    });
    allDay.appendChild(schedulerCreateElement(
      'div',
      'fui-scheduler-all-day-label',
      this._message('allDay')
    ));
    dates.forEach(function(date) {
      var cell = schedulerCreateElement('div', 'fui-scheduler-all-day-cell');
      cell.setAttribute('data-scheduler-date', schedulerDateKey(date));
      cell.setAttribute('data-all-day', '');
      rangeItems.filter(function(item) {
        return item.event.isAllDay === true ||
          item.end - item.start >= 86400000;
      }).filter(function(item) {
        return schedulerEventOverlaps(
          item.event,
          schedulerStartOfDay(date),
          schedulerAddDays(schedulerStartOfDay(date), 1)
        );
      }).slice(0, 3).forEach(function(item) {
        cell.appendChild(self._createEventElement(
          item,
          'fui-scheduler-event-all-day',
          true
        ));
      });
      allDay.appendChild(cell);
    });
    for (minute = startMinutes; minute < endMinutes; minute += slotDuration) {
      row = schedulerCreateElement('div', 'fui-scheduler-time-label');
      row.style.height = slotHeight + 'px';
      if (minute % 60 === 0) {
        row.textContent = this._formatDate(
          schedulerAddMinutes(schedulerStartOfDay(this.options.date), minute),
          { hour: '2-digit', minute: '2-digit' }
        );
      }
      timeAxis.appendChild(row);
    }
    timeAxis.style.height = totalMinutes / slotDuration * slotHeight + 'px';
    dates.forEach(function(date) {
      var dayStart = schedulerStartOfDay(date);
      var dayEnd = schedulerAddDays(dayStart, 1);
      var column = schedulerCreateElement('div', 'fui-scheduler-time-column');
      var timedItems = rangeItems.filter(function(item) {
        return item.event.isAllDay !== true &&
          item.start < dayEnd &&
          item.end > dayStart;
      }).map(function(item) {
        var clippedStart = new Date(Math.max(
          item.start.getTime(),
          schedulerAddMinutes(dayStart, startMinutes).getTime()
        ));
        var clippedEnd = new Date(Math.min(
          item.end.getTime(),
          schedulerAddMinutes(dayStart, endMinutes).getTime()
        ));
        return schedulerAssign({}, item, {
          start: clippedStart,
          end: clippedEnd
        });
      }).filter(function(item) {
        return item.end > item.start;
      });
      column.style.height = totalMinutes / slotDuration * slotHeight + 'px';
      column.style.setProperty('--fui-scheduler-slot-height', slotHeight + 'px');
      column.setAttribute('data-scheduler-date', schedulerDateKey(date));
      schedulerLayoutEvents(timedItems).forEach(function(item) {
        var element = self._createEventElement(item, '', false);
        var top = (
          schedulerMinutes(item.start) - startMinutes
        ) / slotDuration * slotHeight;
        var height = Math.max(
          20,
          (item.end - item.start) / 60000 / slotDuration * slotHeight
        );
        var width = 100 / item.lanes;
        element.style.top = top + 'px';
        element.style.height = height + 'px';
        element.style.left = 'calc(' + (item.lane * width) + '% + 2px)';
        element.style.width = 'calc(' + width + '% - 4px)';
        column.appendChild(element);
      });
      if (schedulerSameDay(date, new Date())) {
        var nowMinutes = schedulerMinutes(new Date());
        if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
          var marker = schedulerCreateElement('div', 'fui-scheduler-now');
          marker.style.top = (
            (nowMinutes - startMinutes) / slotDuration * slotHeight
          ) + 'px';
          column.appendChild(marker);
        }
      }
      columns.appendChild(column);
    });
    scroll.appendChild(timeAxis);
    scroll.appendChild(columns);
    this.contentElement.appendChild(header);
    this.contentElement.appendChild(allDay);
    this.contentElement.appendChild(scroll);
    scrollbarWidth = schedulerScrollbarWidth(scroll);
    header.style.paddingRight = scrollbarWidth + 'px';
    allDay.style.paddingRight = scrollbarWidth + 'px';
    scroll.scrollTop = Math.max(
      0,
      (schedulerParseTime(this.options.scrollTime, 8 * 60) - startMinutes) /
      slotDuration * slotHeight
    );
    this._timeScrollElement = scroll;
  };

  Scheduler.prototype._renderMonthView = function(range) {
    var self = this;
    var grid = schedulerCreateElement('div', 'fui-scheduler-month-grid');
    var day = schedulerDate(range.start);
    var items = this._eventItems(range);
    var weekdays = schedulerStartOfWeek(new Date(2026, 6, 19), this.options.firstDay);
    var index;
    for (index = 0; index < 7; index += 1) {
      grid.appendChild(schedulerCreateElement(
        'div',
        'fui-scheduler-month-weekday',
        this._formatDate(schedulerAddDays(weekdays, index), {
          weekday: 'short'
        })
      ));
    }
    while (day < range.end) {
      (function(date) {
        var cell = schedulerCreateElement('div', 'fui-scheduler-month-cell');
        var heading = schedulerCreateElement(
          'button',
          'fui-scheduler-month-date',
          date.getDate()
        );
        var dayItems = items.filter(function(item) {
          return item.start < schedulerAddDays(date, 1) && item.end > date;
        });
        cell.setAttribute('data-scheduler-date', schedulerDateKey(date));
        if (date.getMonth() !== self.options.date.getMonth()) {
          cell.classList.add('fui-scheduler-other-month');
        }
        if (schedulerSameDay(date, new Date())) {
          cell.classList.add('fui-scheduler-month-today');
        }
        heading.type = 'button';
        heading.addEventListener('click', function(event) {
          event.stopPropagation();
          self.options.date = schedulerDate(date);
          self.view('day');
        });
        cell.appendChild(heading);
        dayItems.slice(0, Number(self.options.monthEventLimit) || 3).forEach(
          function(item) {
            cell.appendChild(self._createEventElement(
              item,
              'fui-scheduler-event-month',
              true
            ));
          }
        );
        if (dayItems.length > (Number(self.options.monthEventLimit) || 3)) {
          var more = schedulerCreateElement(
            'button',
            'fui-scheduler-more',
            self._message('more', {
              count: dayItems.length - (Number(self.options.monthEventLimit) || 3)
            })
          );
          more.type = 'button';
          more.addEventListener('click', function(event) {
            event.stopPropagation();
            self.options.date = schedulerDate(date);
            self.view('agenda');
          });
          cell.appendChild(more);
        }
        grid.appendChild(cell);
      }(schedulerDate(day)));
      day = schedulerAddDays(day, 1);
    }
    this.contentElement.appendChild(grid);
  };

  Scheduler.prototype._renderYearView = function(range) {
    var self = this;
    var year = range.start.getFullYear();
    var wrapper = schedulerCreateElement('div', 'fui-scheduler-year-grid');
    var eventDays = {};
    this._eventItems(range).forEach(function(item) {
      var cursor = schedulerStartOfDay(item.start);
      var last = schedulerStartOfDay(item.end);
      while (cursor <= last && cursor < range.end) {
        eventDays[schedulerDateKey(cursor)] = true;
        cursor = schedulerAddDays(cursor, 1);
      }
    });
    for (var month = 0; month < 12; month += 1) {
      (function(monthIndex) {
        var panel = schedulerCreateElement('section', 'fui-scheduler-year-month');
        var title = schedulerCreateElement(
          'h3',
          'fui-scheduler-year-title',
          self._formatDate(new Date(year, monthIndex, 1), { month: 'long' })
        );
        var calendar = schedulerCreateElement('div', 'fui-scheduler-mini-calendar');
        var first = schedulerStartOfWeek(
          new Date(year, monthIndex, 1),
          self.options.firstDay
        );
        var weekdays = schedulerStartOfWeek(
          new Date(2026, 6, 19),
          self.options.firstDay
        );
        var weekday;
        var offset;
        panel.appendChild(title);
        for (weekday = 0; weekday < 7; weekday += 1) {
          calendar.appendChild(schedulerCreateElement(
            'span',
            'fui-scheduler-mini-weekday',
            self._formatDate(schedulerAddDays(weekdays, weekday), {
              weekday: 'narrow'
            })
          ));
        }
        for (offset = 0; offset < 42; offset += 1) {
          (function(date) {
            var day = schedulerCreateElement(
              'button',
              'fui-scheduler-mini-day',
              date.getDate()
            );
            day.type = 'button';
            if (date.getMonth() !== monthIndex) {
              day.classList.add('fui-scheduler-mini-other');
            }
            if (eventDays[schedulerDateKey(date)]) {
              day.classList.add('fui-scheduler-mini-has-event');
            }
            if (schedulerSameDay(date, new Date())) {
              day.classList.add('fui-scheduler-mini-today');
            }
            day.addEventListener('click', function() {
              self.options.date = schedulerDate(date);
              self.view('day');
            });
            calendar.appendChild(day);
          }(schedulerAddDays(first, offset)));
        }
        panel.appendChild(calendar);
        wrapper.appendChild(panel);
      }(month));
    }
    this.contentElement.appendChild(wrapper);
  };

  Scheduler.prototype._renderAgendaView = function(range) {
    var self = this;
    var list = schedulerCreateElement('div', 'fui-scheduler-agenda-list');
    var items = this._eventItems(range);
    var date = schedulerDate(range.start);
    var rendered = 0;
    while (date < range.end) {
      (function(day) {
        var dayEnd = schedulerAddDays(day, 1);
        var dayItems = items.filter(function(item) {
          return item.start < dayEnd && item.end > day;
        });
        if (!dayItems.length) return;
        rendered += dayItems.length;
        var group = schedulerCreateElement('section', 'fui-scheduler-agenda-group');
        var heading = schedulerCreateElement(
          'h3',
          'fui-scheduler-agenda-date',
          self._formatDate(day, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        );
        group.appendChild(heading);
        dayItems.forEach(function(item) {
          var row = schedulerCreateElement('div', 'fui-scheduler-agenda-event');
          var time = schedulerCreateElement(
            'div',
            'fui-scheduler-agenda-time',
            item.event.isAllDay ?
              self._message('allDay') :
              self._formatDate(item.start, {
                hour: '2-digit',
                minute: '2-digit'
              }) + ' – ' + self._formatDate(item.end, {
                hour: '2-digit',
                minute: '2-digit'
              })
          );
          var event = self._createEventElement(
            item,
            'fui-scheduler-event-agenda',
            true
          );
          row.appendChild(time);
          row.appendChild(event);
          group.appendChild(row);
        });
        list.appendChild(group);
      }(schedulerDate(date)));
      date = schedulerAddDays(date, 1);
    }
    this.contentElement.appendChild(list);
    if (!rendered) this._renderEmpty();
  };

  Scheduler.prototype._renderTimelineView = function(range) {
    var self = this;
    var wrapper = schedulerCreateElement('div', 'fui-scheduler-timeline');
    var header = schedulerCreateElement('div', 'fui-scheduler-timeline-header');
    var body = schedulerCreateElement('div', 'fui-scheduler-timeline-body');
    var startMinutes = schedulerParseTime(this.options.startTime, 7 * 60);
    var endMinutes = schedulerParseTime(this.options.endTime, 24 * 60);
    var duration = endMinutes - startMinutes;
    var slotDuration = this.options.slotDuration;
    var resources = Array.isArray(this.options.resources) ?
      this.options.resources :
      [];
    var primary = resources[0];
    var rows = primary && Array.isArray(primary.dataSource) ?
      primary.dataSource.map(function(item) {
        return {
          text: item.text,
          value: item.value,
          field: primary.field
        };
      }) :
      [{ text: this._message('eventRow'), value: null, field: null }];
    var items = this._eventItems(range).filter(function(item) {
      return item.event.isAllDay !== true;
    });
    header.appendChild(schedulerCreateElement('div', 'fui-scheduler-timeline-corner'));
    for (var minute = startMinutes; minute < endMinutes; minute += slotDuration) {
      var slot = schedulerCreateElement(
        'div',
        'fui-scheduler-timeline-slot',
        minute % 60 === 0 ?
          this._formatDate(schedulerAddMinutes(range.start, minute), {
            hour: '2-digit',
            minute: '2-digit'
          }) :
          ''
      );
      header.appendChild(slot);
    }
    header.style.setProperty(
      '--fui-scheduler-timeline-slots',
      Math.ceil(duration / slotDuration)
    );
    rows.forEach(function(resource) {
      var label = schedulerCreateElement(
        'div',
        'fui-scheduler-timeline-label',
        resource.text
      );
      var track = schedulerCreateElement('div', 'fui-scheduler-timeline-track');
      var rowItems = items.filter(function(item) {
        return !resource.field || item.event[resource.field] === resource.value;
      });
      track.setAttribute('data-scheduler-date', schedulerDateKey(range.start));
      track.style.setProperty(
        '--fui-scheduler-timeline-slots',
        Math.ceil(duration / slotDuration)
      );
      rowItems.forEach(function(item) {
        var element = self._createEventElement(
          item,
          'fui-scheduler-event-timeline',
          false
        );
        var left = (
          schedulerMinutes(item.start) - startMinutes
        ) / duration * 100;
        var width = (item.end - item.start) / 60000 / duration * 100;
        element.style.left = schedulerClamp(left, 0, 100) + '%';
        element.style.width = schedulerClamp(width, 1.5, 100 - left) + '%';
        track.appendChild(element);
      });
      body.appendChild(label);
      body.appendChild(track);
    });
    wrapper.appendChild(header);
    wrapper.appendChild(body);
    this.contentElement.appendChild(wrapper);
  };

  Scheduler.prototype._dateFromSlot = function(slot, pointerEvent) {
    var date = schedulerDate(slot.getAttribute('data-scheduler-date'));
    var view = this.options.currentView;
    var startMinutes;
    var endMinutes;
    var rect;
    var ratio;
    var minutes;
    if (slot.hasAttribute('data-all-day') || view === 'month') {
      return schedulerStartOfDay(date);
    }
    startMinutes = schedulerParseTime(this.options.startTime, 7 * 60);
    endMinutes = schedulerParseTime(this.options.endTime, 24 * 60);
    rect = slot.getBoundingClientRect();
    ratio = view === 'timeline' ?
      (pointerEvent.clientX - rect.left) / Math.max(1, rect.width) :
      (pointerEvent.clientY - rect.top) / Math.max(1, rect.height);
    minutes = startMinutes + schedulerClamp(ratio, 0, 1) *
      (endMinutes - startMinutes);
    minutes = Math.round(minutes / this.options.slotDuration) *
      this.options.slotDuration;
    return schedulerAddMinutes(schedulerStartOfDay(date), minutes);
  };

  Scheduler.prototype._beginEventInteraction = function(event) {
    var self = this;
    var element = event.target.closest('[data-event-index]');
    var index;
    var item;
    var mode;
    if (
      !this.options.editable ||
      event.button !== 0 ||
      !element ||
      !this.contentElement.contains(element) ||
      this.options.currentView === 'month' ||
      this.options.currentView === 'year' ||
      this.options.currentView === 'agenda'
    ) {
      return;
    }
    index = schedulerGetEventIndex(element);
    item = this.options.dataSource[index];
    if (!item) return;
    mode = event.target.closest('[data-resize-event]') ? 'resize' : 'move';
    this._interaction = {
      mode: mode,
      index: index,
      element: element,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      original: schedulerEventDates(item, this.options.date),
      pointerId: event.pointerId
    };
    this._onInteractionMove = function(moveEvent) {
      var interaction = self._interaction;
      if (!interaction || moveEvent.pointerId !== interaction.pointerId) return;
      interaction.deltaX = moveEvent.clientX - interaction.startX;
      interaction.deltaY = moveEvent.clientY - interaction.startY;
      if (
        !interaction.moved &&
        Math.abs(interaction.deltaX) < 4 &&
        Math.abs(interaction.deltaY) < 4
      ) {
        return;
      }
      moveEvent.preventDefault();
      if (!interaction.moved) {
        interaction.moved = true;
        interaction.element.classList.add('fui-scheduler-event-interacting');
      }
      interaction.element.style.transform = 'translate(' +
        interaction.deltaX + 'px,' + interaction.deltaY + 'px)';
    };
    this._onInteractionEnd = function(endEvent) {
      if (
        !self._interaction ||
        endEvent.pointerId !== self._interaction.pointerId
      ) {
        return;
      }
      self._finishEventInteraction(endEvent.type === 'pointercancel');
    };
    document.addEventListener('pointermove', this._onInteractionMove, {
      passive: false
    });
    document.addEventListener('pointerup', this._onInteractionEnd);
    document.addEventListener('pointercancel', this._onInteractionEnd);
    event.preventDefault();
  };

  Scheduler.prototype._unbindInteraction = function() {
    if (this._onInteractionMove) {
      document.removeEventListener('pointermove', this._onInteractionMove);
      document.removeEventListener('pointerup', this._onInteractionEnd);
      document.removeEventListener('pointercancel', this._onInteractionEnd);
    }
    this._onInteractionMove = null;
    this._onInteractionEnd = null;
  };

  Scheduler.prototype._finishEventInteraction = function(cancelled) {
    var interaction = this._interaction;
    var item;
    var deltaMinutes;
    var dayDelta = 0;
    var slotPixels;
    var eventName;
    var nextStart;
    var nextEnd;
    var contentRect;
    var dayCount;
    if (!interaction) return;
    this._unbindInteraction();
    interaction.element.classList.remove('fui-scheduler-event-interacting');
    interaction.element.style.transform = '';
    this._interaction = null;
    if (cancelled || !interaction.moved) return;
    item = this.options.dataSource[interaction.index];
    if (!item) return;
    if (this.options.currentView === 'timeline') {
      contentRect = interaction.element.parentElement.getBoundingClientRect();
      deltaMinutes = interaction.deltaX /
        Math.max(1, contentRect.width) *
        (
          schedulerParseTime(this.options.endTime, 1440) -
          schedulerParseTime(this.options.startTime, 420)
        );
    } else {
      slotPixels = this.options.slotHeight / this.options.slotDuration;
      deltaMinutes = (interaction.deltaY || 0) / Math.max(0.01, slotPixels);
      contentRect = interaction.element.parentElement.parentElement.getBoundingClientRect();
      dayCount = this.options.currentView === 'day' ? 1 :
        this.options.currentView === 'workWeek' ? 5 : 7;
      dayDelta = Math.round(
        (interaction.deltaX || 0) /
        Math.max(1, contentRect.width / dayCount)
      );
    }
    deltaMinutes = Math.round(deltaMinutes / this.options.slotDuration) *
      this.options.slotDuration;
    if (interaction.mode === 'resize') {
      nextStart = interaction.original.start;
      nextEnd = schedulerAddMinutes(interaction.original.end, deltaMinutes);
      if (nextEnd <= nextStart) {
        nextEnd = schedulerAddMinutes(nextStart, this.options.slotDuration);
      }
      eventName = 'Resize';
    } else {
      nextStart = schedulerAddDays(
        schedulerAddMinutes(interaction.original.start, deltaMinutes),
        dayDelta
      );
      nextEnd = schedulerAddDays(
        schedulerAddMinutes(interaction.original.end, deltaMinutes),
        dayDelta
      );
      eventName = 'Move';
    }
    if (this._fire(eventName, {
      event: item,
      index: interaction.index,
      start: nextStart,
      end: nextEnd
    }) === false) {
      return;
    }
    item.start = nextStart;
    item.end = nextEnd;
    this.refresh();
  };

  Scheduler.prototype._createEditorField = function(
    form,
    labelText,
    input,
    className
  ) {
    var field = schedulerCreateElement(
      'label',
      'fui-scheduler-editor-field ' + (className || '')
    );
    var label = schedulerCreateElement(
      'span',
      'fui-scheduler-editor-label',
      labelText
    );
    field.appendChild(label);
    field.appendChild(input);
    form.appendChild(field);
    return field;
  };

  Scheduler.prototype._combineEditorDateTime = function(dateValue, timeValue) {
    var date = schedulerDate(dateValue);
    var minutes = schedulerParseTime(timeValue, 0);
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return date;
  };

  Scheduler.prototype.openEditor = function(source) {
    var self = this;
    var editingIndex = typeof source === 'number' ? source : -1;
    var original = editingIndex >= 0 ?
      this.options.dataSource[editingIndex] :
      schedulerAssign({}, source || {});
    var dates = schedulerEventDates(original, this.options.date);
    var form;
    var footer;
    var host;
    var titleInput;
    var descriptionInput;
    var startDateInput;
    var startTimeInput;
    var endDateInput;
    var endTimeInput;
    var allDayInput;
    var controls = [];
    var resourceControls = [];
    var editorWindow;
    var saveButton;
    var removeButton;
    var cancelButton;
    if (!this.options.editable) return null;
    if (this._editor) this._closeEditor();
    form = schedulerCreateElement('form', 'fui-scheduler-editor');
    footer = schedulerCreateElement('div', 'fui-scheduler-editor-actions');
    host = schedulerCreateElement('div', 'fui-scheduler-editor-host');
    titleInput = document.createElement('input');
    descriptionInput = document.createElement('textarea');
    startDateInput = document.createElement('input');
    startTimeInput = document.createElement('input');
    endDateInput = document.createElement('input');
    endTimeInput = document.createElement('input');
    allDayInput = document.createElement('input');
    titleInput.type = 'text';
    descriptionInput.rows = 3;
    startDateInput.type = 'text';
    startTimeInput.type = 'time';
    endDateInput.type = 'text';
    endTimeInput.type = 'time';
    allDayInput.type = 'checkbox';
    allDayInput.checked = original.isAllDay === true;
    this._createEditorField(form, this._message('title'), titleInput);
    this._createEditorField(form, this._message('description'), descriptionInput);
    var dateRow = schedulerCreateElement('div', 'fui-scheduler-editor-date-row');
    this._createEditorField(
      dateRow,
      this._message('start') + ' ' + this._message('date'),
      startDateInput
    );
    this._createEditorField(
      dateRow,
      this._message('start') + ' ' + this._message('time'),
      startTimeInput
    );
    form.appendChild(dateRow);
    var endRow = schedulerCreateElement('div', 'fui-scheduler-editor-date-row');
    this._createEditorField(
      endRow,
      this._message('end') + ' ' + this._message('date'),
      endDateInput
    );
    this._createEditorField(
      endRow,
      this._message('end') + ' ' + this._message('time'),
      endTimeInput
    );
    form.appendChild(endRow);
    form.appendChild(allDayInput);
    (this.options.resources || []).forEach(function(resource) {
      var select = document.createElement('select');
      (resource.dataSource || []).forEach(function(item) {
        var option = document.createElement('option');
        option.value = String(item.value);
        option.textContent = item.text;
        if (item.value === original[resource.field]) option.selected = true;
        select.appendChild(option);
      });
      self._createEditorField(form, resource.title || resource.field, select);
      resourceControls.push({
        resource: resource,
        element: select
      });
    });
    host.appendChild(form);
    document.body.appendChild(host);
    controls.push(new EditBox(titleInput, {
      editor: 'text',
      value: original.title || '',
      width: '100%',
      theme: this.theme
    }));
    controls.push(new EditBox(descriptionInput, {
      editor: 'text',
      value: original.description || '',
      width: '100%',
      multiline: true,
      theme: this.theme
    }));
    controls.push(new EditBox(startDateInput, {
      editor: 'date',
      value: dates.start,
      width: '100%',
      locale: this.options.locale,
      theme: this.theme
    }));
    controls.push(new EditBox(endDateInput, {
      editor: 'date',
      value: dates.end,
      width: '100%',
      locale: this.options.locale,
      theme: this.theme
    }));
    resourceControls.forEach(function(record) {
      record.control = new EditBox(record.element, {
        editor: 'combo',
        width: '100%',
        editable: false,
        theme: self.theme
      });
      controls.push(record.control);
    });
    startTimeInput.value = schedulerFormatTimeInput(dates.start);
    endTimeInput.value = schedulerFormatTimeInput(dates.end);
    var allDayControl = new CheckBox(allDayInput, {
      label: this._message('allDay'),
      labelPosition: 'after',
      checked: original.isAllDay === true,
      locale: this.options.locale,
      theme: this.theme
    });
    controls.push(allDayControl);
    saveButton = this._createEditorButton(footer, this._message('save'), function() {
      var startDate = controls[2].getDate() || schedulerDate(controls[2].getValue());
      var endDate = controls[3].getDate() || schedulerDate(controls[3].getValue());
      var isAllDay = allDayInput.checked;
      var start = isAllDay ?
        schedulerStartOfDay(startDate) :
        self._combineEditorDateTime(startDate, startTimeInput.value);
      var end = isAllDay ?
        schedulerAddDays(schedulerStartOfDay(endDate), 1) :
        self._combineEditorDateTime(endDate, endTimeInput.value);
      var next;
      if (end <= start) {
        form.setAttribute('data-error', self._message('invalidRange'));
        form.classList.add('fui-scheduler-editor-invalid');
        return;
      }
      next = schedulerAssign({}, original, {
        title: controls[0].getValue(),
        description: controls[1].getValue(),
        start: start,
        end: end,
        isAllDay: isAllDay
      });
      resourceControls.forEach(function(record) {
        var selected = record.element.options[record.element.selectedIndex];
        var match = (record.resource.dataSource || []).find(function(item) {
          return String(item.value) === String(selected && selected.value);
        });
        next[record.resource.field] = match ? match.value : null;
      });
      if (self._fire('Save', {
        event: next,
        index: editingIndex,
        isNew: editingIndex < 0
      }) === false) {
        return;
      }
      if (editingIndex >= 0) {
        schedulerAssign(self.options.dataSource[editingIndex], next);
      } else {
        if (next.id == null) next.id = self._nextEventId();
        self.options.dataSource.push(next);
        self._fire('Create', {
          event: next,
          index: self.options.dataSource.length - 1
        });
      }
      self._closeEditor();
      self.refresh();
    });
    if (editingIndex >= 0) {
      removeButton = this._createEditorButton(
        footer,
        this._message('remove'),
        function() {
          self.removeEvent(editingIndex);
          self._closeEditor();
        }
      );
      removeButton.hostElement.classList.add('fui-scheduler-editor-remove');
    }
    cancelButton = this._createEditorButton(
      footer,
      this._message('cancel'),
      function() {
        self._fire('Cancel', {
          event: original,
          index: editingIndex
        });
        self._closeEditor();
      }
    );
    editorWindow = new Window(host, {
      title: editingIndex >= 0 ?
        this._message('editEvent') :
        this._message('newEvent'),
      width: 560,
      height: 540,
      minWidth: 320,
      minHeight: 420,
      modal: true,
      maximizable: false,
      resizable: true,
      footer: footer,
      theme: this.theme,
      locale: this.options.locale
    });
    editorWindow.on('close', function() {
      self._closeEditor();
    });
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      saveButton.hostElement.click();
    });
    this._editor = {
      window: editorWindow,
      controls: controls,
      buttons: [saveButton, removeButton, cancelButton].filter(Boolean),
      host: host
    };
    titleInput.focus();
    return editorWindow;
  };

  Scheduler.prototype._createEditorButton = function(container, text, handler) {
    var anchor = schedulerCreateElement('a');
    anchor.href = 'javascript:void(0)';
    container.appendChild(anchor);
    return new Button(anchor, {
      text: text,
      theme: this.theme,
      onClick: handler
    });
  };

  Scheduler.prototype._closeEditor = function() {
    var editor = this._editor;
    if (!editor) return;
    this._editor = null;
    if (editor.window && typeof editor.window.dispose === 'function') {
      editor.window.dispose(true);
    }
    editor.controls.forEach(function(control) {
      if (control && typeof control.dispose === 'function') control.dispose();
    });
    editor.buttons.forEach(function(button) {
      if (button && typeof button.dispose === 'function') button.dispose();
    });
    if (editor.host.parentNode) editor.host.parentNode.removeChild(editor.host);
  };

  Scheduler.prototype._nextEventId = function() {
    var maximum = this.options.dataSource.reduce(function(result, event) {
      var value = Number(event && event.id);
      return isFinite(value) ? Math.max(result, value) : result;
    }, 0);
    return maximum + 1;
  };

  Scheduler.prototype.refresh = function() {
    var range;
    if (this._destroyed) return this;
    range = this._viewRange();
    if (this._fire('DataBinding', {
      range: range,
      view: this.options.currentView
    }) === false) {
      return this;
    }
    this._renderToolbar(range);
    this.contentElement.textContent = '';
    this.contentElement.className = 'fui-scheduler-content fui-scheduler-' +
      this.options.currentView.toLowerCase();
    if (
      this.options.currentView === 'day' ||
      this.options.currentView === 'workWeek' ||
      this.options.currentView === 'week'
    ) {
      this._renderTimeView(range);
    } else if (this.options.currentView === 'month') {
      this._renderMonthView(range);
    } else if (this.options.currentView === 'year') {
      this._renderYearView(range);
    } else if (this.options.currentView === 'agenda') {
      this._renderAgendaView(range);
    } else {
      this._renderTimelineView(range);
    }
    this._fire('DataBound', {
      range: range,
      view: this.options.currentView
    });
    return this;
  };

  Scheduler.prototype.resize = function(width, height) {
    if (width != null) this.options.width = width;
    if (height != null) this.options.height = height;
    this.hostElement.style.width = typeof this.options.width === 'number' ?
      this.options.width + 'px' :
      String(this.options.width || '100%');
    this.hostElement.style.height = typeof this.options.height === 'number' ?
      this.options.height + 'px' :
      String(this.options.height || '600px');
    return this;
  };

  Scheduler.prototype.navigate = function(direction) {
    var current = schedulerDate(this.options.date);
    var view = this.options.currentView;
    var next;
    var amount = direction === 'next' ? 1 : -1;
    if (direction === 'today') next = new Date();
    else if (view === 'month') {
      next = schedulerDate(current);
      next.setMonth(next.getMonth() + amount);
    } else if (view === 'year') {
      next = schedulerDate(current);
      next.setFullYear(next.getFullYear() + amount);
    } else if (view === 'week' || view === 'workWeek' || view === 'agenda') {
      next = schedulerAddDays(current, amount * 7);
    } else {
      next = schedulerAddDays(current, amount);
    }
    if (this._fire('Navigate', {
      action: direction,
      date: next,
      view: view
    }) === false) {
      return this;
    }
    this.options.date = next;
    return this.refresh();
  };

  Scheduler.prototype.date = function(value) {
    if (arguments.length === 0) return schedulerDate(this.options.date);
    value = schedulerDate(value, this.options.date);
    if (this._fire('Navigate', {
      action: 'date',
      date: value,
      view: this.options.currentView
    }) === false) {
      return this;
    }
    this.options.date = value;
    return this.refresh();
  };

  Scheduler.prototype.view = function(value) {
    var view;
    if (arguments.length === 0) return this.options.currentView;
    view = normalizeSchedulerView(value);
    if (!this.options.views.some(function(item) { return item.type === view; })) {
      return this;
    }
    if (view === this.options.currentView) return this;
    if (this._fire('Navigate', {
      action: 'view',
      date: this.options.date,
      view: view,
      previousView: this.options.currentView
    }) === false) {
      return this;
    }
    this.options.currentView = view;
    return this.refresh();
  };

  Scheduler.prototype.select = function(index, originalEvent) {
    var item = this.options.dataSource[index];
    if (!item) return this;
    this._selectedIndex = index;
    Array.prototype.forEach.call(
      this.contentElement.querySelectorAll('[data-event-index]'),
      function(element) {
        var selected = schedulerGetEventIndex(element) === index;
        element.classList.toggle('fui-scheduler-event-selected', selected);
        if (selected) element.setAttribute('aria-selected', 'true');
        else element.removeAttribute('aria-selected');
      }
    );
    this._fire('Change', {
      event: item,
      index: index,
      originalEvent: originalEvent || null
    });
    return this;
  };

  Scheduler.prototype.selection = function() {
    return this._selectedIndex >= 0 ?
      this.options.dataSource[this._selectedIndex] || null :
      null;
  };

  Scheduler.prototype.addEvent = function(event) {
    var next = schedulerAssign({}, event || {});
    var dates = schedulerEventDates(next, this.options.date);
    next.start = dates.start;
    next.end = dates.end;
    if (next.id == null) next.id = this._nextEventId();
    if (this._fire('Save', {
      event: next,
      index: -1,
      isNew: true
    }) === false) {
      return null;
    }
    this.options.dataSource.push(next);
    this._fire('Create', {
      event: next,
      index: this.options.dataSource.length - 1
    });
    this.refresh();
    return next;
  };

  Scheduler.prototype.updateEvent = function(index, values) {
    var event = typeof index === 'number' ?
      this.options.dataSource[index] :
      index;
    var eventIndex = typeof index === 'number' ?
      index :
      this.options.dataSource.indexOf(event);
    var next;
    if (!event || eventIndex < 0) return null;
    next = schedulerAssign({}, event, values || {});
    if (this._fire('Save', {
      event: next,
      index: eventIndex,
      isNew: false
    }) === false) {
      return null;
    }
    schedulerAssign(event, next);
    this.refresh();
    return event;
  };

  Scheduler.prototype.removeEvent = function(index) {
    var event = typeof index === 'number' ?
      this.options.dataSource[index] :
      index;
    var eventIndex = typeof index === 'number' ?
      index :
      this.options.dataSource.indexOf(event);
    if (!event || eventIndex < 0) return null;
    if (this._fire('Remove', {
      event: event,
      index: eventIndex
    }) === false) {
      return null;
    }
    this.options.dataSource.splice(eventIndex, 1);
    if (this._selectedIndex === eventIndex) this._selectedIndex = -1;
    else if (this._selectedIndex > eventIndex) this._selectedIndex -= 1;
    this.refresh();
    return event;
  };

  Scheduler.prototype.dataSource = function(value) {
    if (arguments.length === 0) return this.options.dataSource;
    this.options.dataSource = Array.isArray(value) ? value : [];
    this._selectedIndex = -1;
    return this.refresh();
  };

  Scheduler.prototype.setOptions = function(options) {
    options = options || {};
    schedulerAssign(this.options, options);
    if (Object.prototype.hasOwnProperty.call(options, 'views')) {
      this.options.views = schedulerNormalizeViews(options.views);
      this._buildToolbar();
    }
    if (Object.prototype.hasOwnProperty.call(options, 'currentView')) {
      this.options.currentView = normalizeSchedulerView(options.currentView);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'date')) {
      this.options.date = schedulerDate(options.date, this.options.date);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'locale')) {
      this.setLocale(options.locale, options.messages);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'theme')) {
      this.setTheme(options.theme);
    }
    if (
      Object.prototype.hasOwnProperty.call(options, 'width') ||
      Object.prototype.hasOwnProperty.call(options, 'height')
    ) {
      this.resize();
    }
    return this.refresh();
  };

  Scheduler.prototype.setTheme = function(theme) {
    var index;
    this.options.theme = theme == null ? 'inherit' : theme;
    this.theme = this.options.theme === 'inherit' ?
      schedulerFindTheme(this._themeSource) :
      normalizeSchedulerTheme(this.options.theme);
    for (index = 0; index < SCHEDULER_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + SCHEDULER_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    this._buttons.forEach(function(button) {
      button.setTheme(this.theme);
    }, this);
    if (this._editor && this._editor.window) {
      this._editor.window.setTheme(this.theme);
    }
    return this;
  };

  Scheduler.prototype.setLocale = function(locale, messages) {
    this.options.locale = normalizeSchedulerLocale(locale);
    this.options.messages = messages || this.options.messages;
    this.messages = schedulerAssign(
      {},
      SCHEDULER_LOCALES[this.options.locale],
      this.options.messages || {}
    );
    this.hostElement.setAttribute('lang', this.options.locale);
    this.hostElement.setAttribute('aria-label', this._message('event'));
    return this.refresh();
  };

  Scheduler.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  Scheduler.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  Scheduler.prototype.dispose = function() {
    var host = this.hostElement;
    if (this._destroyed) return;
    this._destroyed = true;
    this._unbindInteraction();
    this._closeEditor();
    this._buttons.forEach(function(button) { button.dispose(); });
    this._buttons = [];
    this.removeEventListener();
    if (typeof unregisterControl === 'function') {
      unregisterControl(host, this);
    }
    delete host.__fabuiScheduler;
    host.innerHTML = this._original.html;
    if (this._original.className == null) host.removeAttribute('class');
    else host.setAttribute('class', this._original.className);
    if (this._original.style == null) host.removeAttribute('style');
    else host.setAttribute('style', this._original.style);
    if (this._original.tabIndex == null) host.removeAttribute('tabindex');
    else host.setAttribute('tabindex', this._original.tabIndex);
    if (this._original.role == null) host.removeAttribute('role');
    else host.setAttribute('role', this._original.role);
    if (this._original.ariaLabel == null) host.removeAttribute('aria-label');
    else host.setAttribute('aria-label', this._original.ariaLabel);
    this._listeners = {};
  };

  Scheduler.prototype.destroy = Scheduler.prototype.dispose;

  Scheduler.defaults = {
    width: '100%',
    height: 600,
    date: new Date(),
    currentView: 'workWeek',
    views: [
      'day', 'workWeek', 'week', 'month', 'year', 'agenda', 'timeline'
    ],
    dataSource: [],
    resources: [],
    editable: true,
    selectable: true,
    firstDay: 0,
    startTime: '07:00',
    endTime: '24:00',
    scrollTime: '08:00',
    workDayStart: '08:00',
    workDayEnd: '17:00',
    slotDuration: 30,
    slotHeight: 34,
    monthEventLimit: 3,
    eventColor: '#2572c0',
    locale: 'en',
    theme: 'inherit',
    messages: null,
    onNavigate: null,
    onChange: null,
    onDataBinding: null,
    onDataBound: null,
    onCreate: null,
    onSave: null,
    onRemove: null,
    onCancel: null,
    onMove: null,
    onResize: null
  };
  Scheduler.locales = SCHEDULER_LOCALES;
  Scheduler.themes = SCHEDULER_THEMES.slice();
  Scheduler.views = SCHEDULER_VIEW_TYPES.slice();
  Scheduler.normalizeLocale = normalizeSchedulerLocale;
  Scheduler.normalizeTheme = normalizeSchedulerTheme;
  Scheduler.normalizeView = normalizeSchedulerView;
  Scheduler.getControl = function(element) {
    element = resolveSchedulerElement(element);
    return element && element.__fabuiScheduler ?
      element.__fabuiScheduler :
      null;
  };

  return Scheduler;
}

global.fabui.Scheduler = createSchedulerFactory(global.fabui);
global.fabui.Scheduler.version = "2026.7.23";
}(typeof window !== "undefined" ? window : this));
