import {
  DatePopup,
  findDatePopupTheme,
  normalizeDatePopupTheme
} from '../editbox/date-popup.js?v=20260718-final-audit-v1';

var CALENDAR_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black'
];

var CALENDAR_LOCALES = {
  en: {
    ariaLabel: 'Calendar',
    yearText: 'Year',
    previousYearText: 'Previous year',
    previousMonthText: 'Previous month',
    nextMonthText: 'Next month',
    nextYearText: 'Next year',
    weeks: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  'zh-TW': {
    ariaLabel: '日曆',
    yearText: '年份',
    previousYearText: '上一年',
    previousMonthText: '上個月',
    nextMonthText: '下個月',
    nextYearText: '下一年',
    weeks: ['日', '一', '二', '三', '四', '五', '六'],
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  },
  'zh-CN': {
    ariaLabel: '日历',
    yearText: '年份',
    previousYearText: '上一年',
    previousMonthText: '上个月',
    nextMonthText: '下个月',
    nextYearText: '下一年',
    weeks: ['日', '一', '二', '三', '四', '五', '六'],
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  }
};

function assignCalendarOptions(target) {
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

function resolveCalendarElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function cloneCalendarDate(date) {
  return date instanceof Date && isFinite(date.getTime()) ? new Date(date.getTime()) : null;
}

function calendarDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeCalendarLocale(locale) {
  var value = String(locale || '').replace('_', '-');
  if (CALENDAR_LOCALES[value]) return value;
  if (/^zh-TW/i.test(value)) return 'zh-TW';
  if (/^zh/i.test(value)) return 'zh-CN';
  return 'en';
}

function calendarBooleanAttribute(element, name) {
  var value = element.getAttribute(name);
  if (value == null) return undefined;
  return value === '' || value === name || value === 'true' || value === '1';
}

function calendarSizeValue(value) {
  if (value == null || value === '' || value === 'auto') return '';
  return typeof value === 'number' ? Math.max(0, value) + 'px' : String(value);
}

function restoreCalendarAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function createCalendarFactory(Control, registerControl, unregisterControl) {
  function FabCalendar(element, options) {
    var host = resolveCalendarElement(element);
    var current;
    var viewDate;
    var suppliedOptions;
    if (!(this instanceof FabCalendar)) return new FabCalendar(element, options);
    if (!host) throw new Error('fabui.Calendar requires a host element.');
    if (host.__fabuiCalendar) return host.__fabuiCalendar;
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._original = {
      html: host.innerHTML,
      className: host.getAttribute('class'),
      style: host.getAttribute('style'),
      role: host.getAttribute('role'),
      ariaLabel: host.getAttribute('aria-label'),
      tabIndex: host.getAttribute('tabindex')
    };
    suppliedOptions = assignCalendarOptions({}, this._readElementOptions(), options || {});
    this.options = assignCalendarOptions({}, FabCalendar.defaults, suppliedOptions);
    this._normalizeOptions(suppliedOptions);
    current = cloneCalendarDate(this.options.current);
    viewDate = current || calendarDateOnly(new Date());
    if (
      Object.prototype.hasOwnProperty.call(suppliedOptions, 'year') ||
      Object.prototype.hasOwnProperty.call(suppliedOptions, 'month')
    ) {
      viewDate = new Date(
        Object.prototype.hasOwnProperty.call(suppliedOptions, 'year') ?
          this.options.year :
          viewDate.getFullYear(),
        Object.prototype.hasOwnProperty.call(suppliedOptions, 'month') ?
          this.options.month - 1 :
          viewDate.getMonth(),
        1
      );
    }
    host.textContent = '';
    host.classList.add('fui-calendar-control');
    host.classList.toggle('fui-calendar-noborder', !this.options.border);
    host.__fabuiCalendar = this;
    registerControl(host, this);
    this._createPopup();
    this._popup.setValue(current, viewDate);
    this.resize(null, true);
    this.setTheme(this.options.theme);
  }

  FabCalendar.prototype = Object.create(Control.prototype);
  FabCalendar.prototype.constructor = FabCalendar;

  FabCalendar.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = {};
    var value;
    value = host.getAttribute('width') || host.style.width;
    if (value) options.width = isFinite(Number(value)) ? Number(value) : value;
    value = host.getAttribute('height') || host.style.height;
    if (value) options.height = isFinite(Number(value)) ? Number(value) : value;
    value = host.getAttribute('firstDay');
    if (value != null && value !== '') options.firstDay = Number(value);
    value = host.getAttribute('weekNumberHeader');
    if (value != null) options.weekNumberHeader = value;
    value = host.getAttribute('locale');
    if (value) options.locale = value;
    value = host.getAttribute('theme');
    if (value) options.theme = value;
    ['fit', 'border', 'showWeek', 'showLunar'].forEach(function(name) {
      var parsed = calendarBooleanAttribute(host, name);
      if (parsed != null) options[name] = parsed;
    });
    return options;
  };

  FabCalendar.prototype._normalizeOptions = function(userOptions) {
    var localeName = normalizeCalendarLocale(this.options.locale);
    var locale = CALENDAR_LOCALES[localeName];
    this.options.locale = localeName;
    this.options.firstDay = Math.max(0, Math.min(6, parseInt(this.options.firstDay, 10) || 0));
    this.options.year = Math.max(1, Math.min(9999, parseInt(this.options.year, 10) || new Date().getFullYear()));
    this.options.month = Math.max(1, Math.min(12, parseInt(this.options.month, 10) || (new Date().getMonth() + 1)));
    this.options.current = cloneCalendarDate(this.options.current);
    this.options.showWeek = this.options.showWeek === true;
    this.options.showLunar = this.options.showLunar === true;
    this.options.fit = this.options.fit === true;
    this.options.border = this.options.border !== false;
    [
      'ariaLabel', 'yearText', 'previousYearText', 'previousMonthText',
      'nextMonthText', 'nextYearText', 'weeks', 'months'
    ].forEach(function(name) {
      if (!Object.prototype.hasOwnProperty.call(userOptions, name) ||
        userOptions[name] == null) {
        this.options[name] = Array.isArray(locale[name]) ? locale[name].slice() : locale[name];
      }
    }, this);
    this.options.weeks = Array.isArray(this.options.weeks) && this.options.weeks.length === 7 ?
      this.options.weeks.slice() :
      locale.weeks.slice();
    this.options.months = Array.isArray(this.options.months) && this.options.months.length === 12 ?
      this.options.months.slice() :
      locale.months.slice();
  };

  FabCalendar.prototype._createPopup = function() {
    var self = this;
    this._popup = new DatePopup({
      embedded: true,
      embeddedHost: this.hostElement,
      className: this.options.cls,
      theme: this.options.theme,
      themeSource: this.hostElement,
      panelWidth: '100%',
      panelHeight: '100%',
      ariaLabel: this.options.ariaLabel,
      firstDay: this.options.firstDay,
      showWeek: this.options.showWeek,
      showLunar: this.options.showLunar,
      weekNumberHeader: this.options.weekNumberHeader,
      locale: this.options.locale,
      yearText: this.options.yearText,
      previousYearText: this.options.previousYearText,
      previousMonthText: this.options.previousMonthText,
      nextMonthText: this.options.nextMonthText,
      nextYearText: this.options.nextYearText,
      weeks: this.options.weeks,
      months: this.options.months,
      buttons: [],
      formatter: this.options.formatter,
      styler: this.options.styler,
      validator: this.options.validator,
      validatorContext: this.hostElement,
      getWeekNumber: this.options.getWeekNumber,
      owner: this,
      onSelect: function(date) {
        self.options.current = cloneCalendarDate(date);
        self._fire('Select', { date: cloneCalendarDate(date) });
      },
      onChange: function(newDate, oldDate) {
        self.options.current = cloneCalendarDate(newDate);
        self._fire('Change', {
          newDate: cloneCalendarDate(newDate),
          oldDate: cloneCalendarDate(oldDate)
        });
      },
      onNavigate: function(year, month) {
        self.options.year = year;
        self.options.month = month;
        self._fire('Navigate', { year: year, month: month });
      }
    });
    this.calendarElement = this._popup.calendar;
    this.panelElement = this._popup.panel;
    this.hostElement.setAttribute('role', 'application');
    this.hostElement.setAttribute('aria-label', this.options.ariaLabel);
    if (!this.hostElement.hasAttribute('tabindex')) this.hostElement.tabIndex = 0;
    this._onKeyDown = function(event) {
      self._popup.handleKeyDown(event);
    };
    this.addEventListener(this.hostElement, 'keydown', this._onKeyDown);
  };

  FabCalendar.prototype._syncPopupOptions = function() {
    this._popup.setOptions({
      className: this.options.cls,
      theme: this.options.theme,
      themeSource: this.hostElement,
      ariaLabel: this.options.ariaLabel,
      firstDay: this.options.firstDay,
      showWeek: this.options.showWeek,
      showLunar: this.options.showLunar,
      weekNumberHeader: this.options.weekNumberHeader,
      locale: this.options.locale,
      yearText: this.options.yearText,
      previousYearText: this.options.previousYearText,
      previousMonthText: this.options.previousMonthText,
      nextMonthText: this.options.nextMonthText,
      nextYearText: this.options.nextYearText,
      weeks: this.options.weeks,
      months: this.options.months,
      formatter: this.options.formatter,
      styler: this.options.styler,
      validator: this.options.validator,
      validatorContext: this.hostElement,
      getWeekNumber: this.options.getWeekNumber
    });
    this.hostElement.classList.toggle('fui-calendar-noborder', !this.options.border);
    this.hostElement.setAttribute('aria-label', this.options.ariaLabel);
    return this;
  };

  FabCalendar.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var args = assignCalendarOptions({ calendar: this }, detail || {});
    if (typeof callback === 'function') {
      if (name === 'Select') callback.call(this.hostElement, args.date);
      else if (name === 'Change') callback.call(this.hostElement, args.newDate, args.oldDate);
      else if (name === 'Navigate') callback.call(this.hostElement, args.year, args.month);
      else callback.call(this.hostElement, this, args);
    }
    listeners.forEach(function(listener) {
      listener.call(this, args);
    }, this);
    return this;
  };

  FabCalendar.prototype.resize = function(param, silent) {
    param = param || {};
    if (Object.prototype.hasOwnProperty.call(param, 'width')) this.options.width = param.width;
    if (Object.prototype.hasOwnProperty.call(param, 'height')) this.options.height = param.height;
    if (this.options.fit) {
      this.hostElement.style.width = '100%';
      this.hostElement.style.height = '100%';
    } else {
      this.hostElement.style.width = calendarSizeValue(this.options.width);
      this.hostElement.style.height = calendarSizeValue(this.options.height);
    }
    this._popup.resize({ width: '100%', height: '100%' });
    if (!silent) {
      this._fire('Resize', {
        width: this.options.width,
        height: this.options.height
      });
    }
    return this;
  };

  FabCalendar.prototype.moveTo = function(date) {
    this._popup.moveTo(date);
    return this;
  };

  FabCalendar.prototype.select = function(date) {
    this._popup.select(date);
    return this;
  };

  FabCalendar.prototype.refresh = function() {
    this._popup.render();
    return this;
  };

  FabCalendar.prototype.setOptions = function(options) {
    options = options || {};
    assignCalendarOptions(this.options, options);
    this._normalizeOptions(options);
    this._syncPopupOptions();
    if (Object.prototype.hasOwnProperty.call(options, 'current')) {
      this.moveTo(this.options.current);
    } else if (
      Object.prototype.hasOwnProperty.call(options, 'year') ||
      Object.prototype.hasOwnProperty.call(options, 'month')
    ) {
      this._popup.viewDate = new Date(this.options.year, this.options.month - 1, 1);
      this._popup.render();
    }
    this.resize(null, true);
    this.setTheme(this.options.theme);
    return this;
  };

  FabCalendar.prototype.setTheme = function(theme) {
    var index;
    this.options.theme = theme == null ? 'inherit' : theme;
    this.theme = this.options.theme === 'inherit' ?
      findDatePopupTheme(this.hostElement.parentElement || document.body) :
      normalizeDatePopupTheme(this.options.theme);
    for (index = 0; index < CALENDAR_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + CALENDAR_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    this._popup.setOptions({
      theme: this.theme,
      themeSource: this.hostElement
    });
    return this;
  };

  FabCalendar.prototype.setLocale = function(locale, messages) {
    this.options.locale = normalizeCalendarLocale(locale);
    return this.setOptions(assignCalendarOptions(
      { locale: this.options.locale },
      messages || {}
    ));
  };

  FabCalendar.prototype.calendar = function() {
    return this.calendarElement;
  };

  FabCalendar.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabCalendar.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabCalendar.prototype.destroy = function() {
    var host = this.hostElement;
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    this._popup.destroy();
    unregisterControl(host, this);
    delete host.__fabuiCalendar;
    host.innerHTML = this._original.html;
    restoreCalendarAttribute(host, 'class', this._original.className);
    restoreCalendarAttribute(host, 'style', this._original.style);
    restoreCalendarAttribute(host, 'role', this._original.role);
    restoreCalendarAttribute(host, 'aria-label', this._original.ariaLabel);
    restoreCalendarAttribute(host, 'tabindex', this._original.tabIndex);
    this._listeners = {};
  };

  FabCalendar.prototype.dispose = FabCalendar.prototype.destroy;

  FabCalendar.defaults = {
    width: 180,
    height: 180,
    fit: false,
    border: true,
    showWeek: false,
    showLunar: false,
    weekNumberHeader: '',
    firstDay: 0,
    weeks: null,
    months: null,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    current: calendarDateOnly(new Date()),
    getWeekNumber: DatePopup.defaults.getWeekNumber,
    formatter: DatePopup.defaults.formatter,
    styler: DatePopup.defaults.styler,
    validator: function() { return true; },
    locale: 'en',
    theme: 'inherit',
    cls: '',
    ariaLabel: null,
    yearText: null,
    previousYearText: null,
    previousMonthText: null,
    nextMonthText: null,
    nextYearText: null,
    onSelect: null,
    onChange: null,
    onNavigate: null,
    onResize: null
  };

  FabCalendar.locales = CALENDAR_LOCALES;
  FabCalendar.getControl = function(element) {
    element = resolveCalendarElement(element);
    return element && element.__fabuiCalendar ? element.__fabuiCalendar : null;
  };
  return FabCalendar;
}
