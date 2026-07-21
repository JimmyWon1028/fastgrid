var activeDatePopup = null;
var datePopupLunarFormatters = {};
var DATE_POPUP_THEMES = [
  'default',
  'bootstrap',
  'cupertino',
  'material',
  'material-blue',
  'material-teal',
  'metro',
  'metro-blue',
  'metro-gray',
  'metro-green',
  'metro-orange',
  'metro-red',
  'sunny',
  'pepper-grinder',
  'dark-hive',
  'black',
  'mono', 'mono-red', 'mono-green'
];
var DATE_POPUP_LUNAR_DAYS = [
  '',
  '初一', '初二', '初三', '初四', '初五',
  '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五',
  '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五',
  '廿六', '廿七', '廿八', '廿九', '三十'
];

function assignDatePopupOptions(target) {
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

function resolveDatePopupElement(element) {
  return typeof element === 'string' ? document.querySelector(element) : element;
}

function cloneDatePopupDate(date) {
  return date instanceof Date && isFinite(date.getTime()) ? new Date(date.getTime()) : null;
}

function toDatePopupDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDatePopupDate(left, right) {
  return Boolean(left && right) &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function padDatePopupNumber(value) {
  return value < 10 ? '0' + value : String(value);
}

function formatDatePopupIso(date) {
  return date.getFullYear() + '-' +
    padDatePopupNumber(date.getMonth() + 1) + '-' +
    padDatePopupNumber(date.getDate());
}

function parseDatePopupIso(value) {
  var parts = String(value || '').split('-');
  var date;
  if (parts.length !== 3) return null;
  date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isFinite(date.getTime()) ? date : null;
}

function getDatePopupWeekNumber(date) {
  var current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var day = current.getUTCDay() || 7;
  var yearStart;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
}

export function normalizeDatePopupTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return DATE_POPUP_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function findDatePopupTheme(element) {
  var current = resolveDatePopupElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < DATE_POPUP_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + DATE_POPUP_THEMES[index])) {
        return DATE_POPUP_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function getDatePopupLunarFormatter(locale) {
  var name = /^zh(?:-|_)?cn/i.test(locale || '') ? 'zh-CN' : 'zh-TW';
  if (Object.prototype.hasOwnProperty.call(datePopupLunarFormatters, name)) {
    return datePopupLunarFormatters[name];
  }
  try {
    datePopupLunarFormatters[name] = new Intl.DateTimeFormat(
      name + '-u-ca-chinese-nu-latn',
      {
        month: 'long',
        day: 'numeric'
      }
    );
  } catch (error) {
    datePopupLunarFormatters[name] = null;
  }
  return datePopupLunarFormatters[name];
}

export function formatDatePopupLunarText(date, locale) {
  var formatter = getDatePopupLunarFormatter(locale);
  var parts;
  var month = '';
  var day = 0;
  var index;
  if (!formatter || !(date instanceof Date) || !isFinite(date.getTime())) {
    return '';
  }
  try {
    parts = formatter.formatToParts(date);
    for (index = 0; index < parts.length; index += 1) {
      if (parts[index].type === 'month') month = parts[index].value;
      if (parts[index].type === 'day') day = parseInt(parts[index].value, 10) || 0;
    }
  } catch (error) {
    return '';
  }
  if (!DATE_POPUP_LUNAR_DAYS[day]) {
    return '';
  }
  return day === 1 ?
    month + ' ' + DATE_POPUP_LUNAR_DAYS[day] :
    DATE_POPUP_LUNAR_DAYS[day];
}

function DatePopupController(popup) {
  this.popup = popup;
  this.element = popup.calendar;
}

DatePopupController.prototype.options = function(options) {
  var shouldApply;
  if (!options) {
    return {
      current: cloneDatePopupDate(this.popup.viewDate),
      selected: cloneDatePopupDate(this.popup.selectedDate),
      firstDay: this.popup.options.firstDay,
      weeks: this.popup.options.weeks.slice(),
      months: this.popup.options.months.slice(),
      showWeek: this.popup.options.showWeek,
      showLunar: this.popup.options.showLunar,
      theme: this.popup.themeName,
      formatter: this.popup.options.formatter,
      styler: this.popup.options.styler,
      validator: this.popup.options.validator,
      getWeekNumber: this.popup.options.getWeekNumber
    };
  }
  if (typeof this.popup.options.onOptionsChange === 'function') {
    shouldApply = this.popup.options.onOptionsChange(options, this.popup);
    if (shouldApply === false) return this;
  }
  this.popup.setOptions(options);
  return this;
};

DatePopupController.prototype.moveTo = function(date) {
  this.popup.moveTo(date);
  return this;
};

DatePopupController.prototype.select = function(date) {
  this.popup.select(date);
  return this;
};

DatePopupController.prototype.resize = function() {
  this.popup.resize.apply(this.popup, arguments);
  return this;
};

export function DatePopup(options) {
  if (!(this instanceof DatePopup)) return new DatePopup(options);
  this.options = assignDatePopupOptions({}, DatePopup.defaults, options || {});
  this.destroyed = false;
  this.visible = false;
  this.menuVisible = false;
  this._openEventsBound = false;
  this.selectedDate = null;
  this.viewDate = toDatePopupDateOnly(new Date());
  this.sharedCalendarState = null;
  this._normalizeOptions();
  this._build();
  this._configureSharedCalendar();
  this._applyThemeClasses();
  this._bind();
  this.controller = new DatePopupController(this);
  this.render();
}

DatePopup.defaults = {
  anchor: null,
  className: '',
  theme: 'default',
  themeSource: null,
  panelWidth: 250,
  panelHeight: 'auto',
  ariaLabel: 'Date picker',
  firstDay: 0,
  showWeek: false,
  showLunar: false,
  weekNumberHeader: '',
  locale: 'zh-TW',
  currentText: 'Today',
  currentMonthText: 'Current month',
  closeText: 'Close',
  yearText: 'Year',
  previousYearText: 'Previous year',
  previousMonthText: 'Previous month',
  nextMonthText: 'Next month',
  nextYearText: 'Next year',
  weeks: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  buttons: null,
  calendarMode: 'days',
  sharedCalendar: null,
  validator: null,
  validatorContext: null,
  owner: null,
  containsTarget: null,
  openClassHost: null,
  onSelect: null,
  onOptionsChange: null,
  onShow: null,
  onHide: null,
  onChange: null,
  onNavigate: null,
  formatter: function(date) { return date.getDate(); },
  styler: function() { return ''; },
  getWeekNumber: getDatePopupWeekNumber,
  embeddedHost: null,
  embedded: false
};

DatePopup.prototype._normalizeOptions = function() {
  this.options.firstDay = Math.max(0, Math.min(6, parseInt(this.options.firstDay, 10) || 0));
  this.options.weeks = Array.isArray(this.options.weeks) && this.options.weeks.length === 7 ?
    this.options.weeks.slice() :
    DatePopup.defaults.weeks.slice();
  this.options.months = Array.isArray(this.options.months) && this.options.months.length === 12 ?
    this.options.months.slice() :
    DatePopup.defaults.months.slice();
  this.options.calendarMode = this.options.calendarMode === 'months' ? 'months' : 'days';
  this.options.showLunar = this.options.showLunar === true;
  this.themeName = this.options.theme === 'inherit' ?
    findDatePopupTheme(this.options.themeSource || this.options.anchor) :
    normalizeDatePopupTheme(this.options.theme);
  this.options.validator = typeof this.options.validator === 'function' ?
    this.options.validator :
    function() { return true; };
  this.options.formatter = typeof this.options.formatter === 'function' ?
    this.options.formatter :
    DatePopup.defaults.formatter;
  this.options.styler = typeof this.options.styler === 'function' ?
    this.options.styler :
    DatePopup.defaults.styler;
  this.options.getWeekNumber = typeof this.options.getWeekNumber === 'function' ?
    this.options.getWeekNumber :
    DatePopup.defaults.getWeekNumber;
  this.options.embedded = this.options.embedded === true;
};

DatePopup.prototype._applyThemeClasses = function() {
  var index;
  var themeClass = 'fg-theme-' + this.themeName;
  for (index = 0; index < DATE_POPUP_THEMES.length; index += 1) {
    this.panel.classList.remove('fg-theme-' + DATE_POPUP_THEMES[index]);
    this.calendar.classList.remove('fg-theme-' + DATE_POPUP_THEMES[index]);
  }
  this.panel.classList.add(themeClass);
  this.calendar.classList.add(themeClass);
};

DatePopup.prototype._startThemeObserver = function() {
  var self = this;
  var source = resolveDatePopupElement(this.options.themeSource || this.options.anchor);
  var observeRoot;
  this._stopThemeObserver();
  if (
    this.options.theme !== 'inherit' ||
    !source ||
    typeof MutationObserver !== 'function'
  ) {
    return;
  }
  this._themeObserver = new MutationObserver(function() {
    var themeName = findDatePopupTheme(source);
    if (themeName === self.themeName) return;
    self.themeName = themeName;
    self._applyThemeClasses();
  });
  observeRoot = source.ownerDocument && source.ownerDocument.documentElement ?
    source.ownerDocument.documentElement :
    source;
  this._themeObserver.observe(observeRoot, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: observeRoot !== source
  });
};

DatePopup.prototype._stopThemeObserver = function() {
  if (!this._themeObserver) return;
  this._themeObserver.disconnect();
  this._themeObserver = null;
};

DatePopup.prototype._build = function() {
  var embeddedHost = resolveDatePopupElement(this.options.embeddedHost);
  var panel = document.createElement('div');
  var calendar = document.createElement('div');
  var header = document.createElement('div');
  var title = document.createElement('button');
  var body = document.createElement('div');
  var menu = document.createElement('div');
  var footer = document.createElement('div');
  var nav = [
    ['fui-calendar-prevyear', this.options.previousYearText, -12],
    ['fui-calendar-prevmonth', this.options.previousMonthText, -1],
    ['fui-calendar-nextmonth', this.options.nextMonthText, 1],
    ['fui-calendar-nextyear', this.options.nextYearText, 12]
  ];
  var index;
  var button;
  panel.className = (
    (this.options.embedded ? 'fui-calendar-embedded-panel ' : 'fui-datebox-panel ') +
    (this.options.className || '')
  ).trim();
  panel.hidden = !this.options.embedded;
  panel.setAttribute('role', this.options.embedded ? 'group' : 'dialog');
  if (!this.options.embedded) panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', this.options.ariaLabel);
  calendar.className = 'fui-calendar';
  header.className = 'fui-calendar-header';
  title.className = 'fui-calendar-title';
  title.type = 'button';
  body.className = 'fui-calendar-body';
  menu.className = 'fui-calendar-menu';
  menu.hidden = true;
  footer.className = 'fui-datebox-buttons';
  for (index = 0; index < nav.length; index += 1) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'fui-calendar-nav ' + nav[index][0];
    button.setAttribute('aria-label', nav[index][1]);
    button.setAttribute('data-month-offset', nav[index][2]);
    header.appendChild(button);
  }
  header.appendChild(title);
  calendar.appendChild(header);
  calendar.appendChild(body);
  calendar.appendChild(menu);
  panel.appendChild(calendar);
  panel.appendChild(footer);
  (this.options.embedded && embeddedHost ? embeddedHost : document.body).appendChild(panel);
  this.panel = panel;
  this.calendar = calendar;
  this.calendarHeader = header;
  this.calendarTitle = title;
  this.calendarBody = body;
  this.calendarMenu = menu;
  this.buttonBar = footer;
  if (this.options.embedded) {
    footer.hidden = true;
    calendar.__fabuiDatePopupOwner = this;
  }
};

DatePopup.prototype._configureSharedCalendar = function() {
  var host = resolveDatePopupElement(this.options.sharedCalendar);
  var state;
  if (!host) return;
  state = host.__fabuiDatePopupSharedCalendar;
  if (state) {
    if (this.calendar.parentNode) this.calendar.parentNode.removeChild(this.calendar);
    this.calendar = state.calendar;
    this.calendarHeader = this.calendar.querySelector('.fui-calendar-header');
    this.calendarTitle = this.calendar.querySelector('.fui-calendar-title');
    this.calendarBody = this.calendar.querySelector('.fui-calendar-body');
    this.calendarMenu = this.calendar.querySelector('.fui-calendar-menu');
  } else {
    state = { calendar: this.calendar, host: host };
    host.__fabuiDatePopupSharedCalendar = state;
    host.classList.add('fui-datebox-shared-calendar');
    host.appendChild(this.calendar);
  }
  this.sharedCalendarState = state;
};

DatePopup.prototype._bind = function() {
  var self = this;
  this._onCalendarClick = function(event) {
    var owner = self.calendar.__fabuiDatePopupOwner;
    if (owner && !owner.destroyed) owner._handleClick(event);
  };
  this._onPanelClick = function(event) {
    if (event.target.closest('[data-button-index]')) self._handleClick(event);
  };
  this._onPanelMouseDown = function(event) {
    if (!event.target.closest('input')) event.preventDefault();
  };
  this._onPanelChange = function(event) {
    var input = event.target.closest('.fui-calendar-menu-year');
    if (!input) return;
    self.viewDate = new Date(
      Math.max(1, Math.min(9999, parseInt(input.value, 10) || self.viewDate.getFullYear())),
      self.viewDate.getMonth(),
      1
    );
    self.render();
  };
  this._onDocumentMouseDown = function(event) {
    if (!self.visible || self.panel.contains(event.target) || self._containsTarget(event.target)) return;
    self.hide();
  };
  this._onDocumentKeyDown = function(event) {
    if (!self.visible || event.key !== 'Escape') return;
    event.preventDefault();
    self.hide();
  };
  this._onWindowChange = function() {
    if (self.visible) self.position();
  };
  if (!this.calendar.__fabuiDatePopupClickBound) {
    this.calendar.addEventListener('click', this._onCalendarClick);
    this.calendar.__fabuiDatePopupClickBound = true;
  }
  this.panel.addEventListener('click', this._onPanelClick);
  this.panel.addEventListener('mousedown', this._onPanelMouseDown);
  this.panel.addEventListener('change', this._onPanelChange);
};

DatePopup.prototype._bindOpenEvents = function() {
  if (this.options.embedded || this._openEventsBound) return;
  this._openEventsBound = true;
  document.addEventListener('mousedown', this._onDocumentMouseDown);
  document.addEventListener('keydown', this._onDocumentKeyDown);
  window.addEventListener('resize', this._onWindowChange);
  window.addEventListener('scroll', this._onWindowChange, true);
};

DatePopup.prototype._unbindOpenEvents = function() {
  if (!this._openEventsBound) return;
  this._openEventsBound = false;
  document.removeEventListener('mousedown', this._onDocumentMouseDown);
  document.removeEventListener('keydown', this._onDocumentKeyDown);
  window.removeEventListener('resize', this._onWindowChange);
  window.removeEventListener('scroll', this._onWindowChange, true);
};

DatePopup.prototype._containsTarget = function(target) {
  var anchor = resolveDatePopupElement(this.options.anchor);
  var containsTarget = this.options.containsTarget;
  if (anchor && (anchor === target || anchor.contains(target))) return true;
  return typeof containsTarget === 'function' && containsTarget(target) === true;
};

DatePopup.prototype.setOptions = function(options) {
  var hasCalendarMode = options &&
    Object.prototype.hasOwnProperty.call(options, 'calendarMode');
  assignDatePopupOptions(this.options, options || {});
  this._normalizeOptions();
  if (hasCalendarMode) {
    this.menuVisible = this.options.calendarMode === 'months';
  }
  this.panel.className = (
    (this.options.embedded ? 'fui-calendar-embedded-panel ' : 'fui-datebox-panel ') +
    (this.options.className || '')
  ).trim();
  this._applyThemeClasses();
  if (this.visible) this._startThemeObserver();
  this.panel.setAttribute('aria-label', this.options.ariaLabel);
  this.calendar.querySelector('.fui-calendar-prevyear')
    .setAttribute('aria-label', this.options.previousYearText);
  this.calendar.querySelector('.fui-calendar-prevmonth')
    .setAttribute('aria-label', this.options.previousMonthText);
  this.calendar.querySelector('.fui-calendar-nextmonth')
    .setAttribute('aria-label', this.options.nextMonthText);
  this.calendar.querySelector('.fui-calendar-nextyear')
    .setAttribute('aria-label', this.options.nextYearText);
  this.calendar.classList.toggle('fui-calendar-month-mode', this.options.calendarMode === 'months');
  this.calendar.classList.toggle(
    'fui-calendar-show-lunar',
    this.options.showLunar && this.options.calendarMode === 'days'
  );
  this.render();
  return this;
};

DatePopup.prototype.setValue = function(selectedDate, viewDate) {
  this.selectedDate = cloneDatePopupDate(selectedDate);
  this.viewDate = cloneDatePopupDate(viewDate) ||
    cloneDatePopupDate(this.selectedDate) ||
    toDatePopupDateOnly(new Date());
  this.render();
  return this;
};

DatePopup.prototype.render = function() {
  var year = this.viewDate.getFullYear();
  var month = this.viewDate.getMonth();
  var first = new Date(year, month, 1);
  var offset = (first.getDay() - this.options.firstDay + 7) % 7;
  var cursor = new Date(year, month, 1 - offset);
  var today = toDatePopupDateOnly(new Date());
  var table = document.createElement('table');
  var head = document.createElement('thead');
  var row = document.createElement('tr');
  var body = document.createElement('tbody');
  var index;
  var dayIndex;
  var cell;
  var button;
  var date;
  var valid;
  var solar;
  var lunar;
  var lunarText;
  var ariaLabel;
  var formatted;
  var styleValue;
  var classValue;
  var styleKey;
  this.calendar.classList.toggle(
    'fui-calendar-show-lunar',
    this.options.showLunar && this.options.calendarMode === 'days'
  );
  this.calendarTitle.textContent = this.options.months[month] + ' ' + year;
  table.setAttribute('role', 'grid');
  if (this.options.showWeek) {
    cell = document.createElement('th');
    cell.className = 'fui-calendar-week-number';
    cell.textContent = this.options.weekNumberHeader || '';
    row.appendChild(cell);
  }
  for (index = 0; index < 7; index += 1) {
    cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = this.options.weeks[(this.options.firstDay + index) % 7];
    row.appendChild(cell);
  }
  head.appendChild(row);
  table.appendChild(head);
  for (index = 0; index < 6; index += 1) {
    row = document.createElement('tr');
    if (this.options.showWeek) {
      cell = document.createElement('td');
      cell.className = 'fui-calendar-week-number';
      cell.textContent = this.options.getWeekNumber.call(
        this.options.validatorContext || this.options.owner || this.calendar,
        new Date(cursor.getTime())
      );
      row.appendChild(cell);
    }
    for (dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      valid = this.options.validator.call(this.options.validatorContext, date);
      cell = document.createElement('td');
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'fui-calendar-day';
      formatted = this.options.formatter.call(
        this.options.validatorContext || this.options.owner || this.calendar,
        new Date(date.getTime())
      );
      styleValue = this.options.styler.call(
        this.options.validatorContext || this.options.owner || this.calendar,
        new Date(date.getTime())
      );
      classValue = '';
      if (typeof styleValue === 'string') {
        cell.style.cssText = styleValue;
      } else if (styleValue && typeof styleValue === 'object') {
        classValue = styleValue.class || styleValue.className || '';
        if (typeof styleValue.style === 'string') {
          cell.style.cssText = styleValue.style;
        } else if (styleValue.style && typeof styleValue.style === 'object') {
          for (styleKey in styleValue.style) {
            if (Object.prototype.hasOwnProperty.call(styleValue.style, styleKey)) {
              cell.style[styleKey] = styleValue.style[styleKey];
            }
          }
        }
      }
      if (classValue) {
        String(classValue).split(/\s+/).forEach(function(name) {
          if (name) cell.classList.add(name);
        });
      }
      if (this.options.showLunar) {
        solar = document.createElement('span');
        lunar = document.createElement('span');
        lunarText = formatDatePopupLunarText(date, this.options.locale);
        solar.className = 'fui-calendar-solar';
        solar.textContent = formatted == null ? '' : String(formatted);
        lunar.className = 'fui-calendar-lunar';
        lunar.textContent = lunarText;
        button.appendChild(solar);
        button.appendChild(lunar);
      } else {
        button.textContent = formatted == null ? '' : String(formatted);
        lunarText = '';
      }
      button.setAttribute('data-date', formatDatePopupIso(date));
      ariaLabel = formatDatePopupIso(date);
      if (lunarText) ariaLabel += ' ' + lunarText;
      button.setAttribute('aria-label', ariaLabel);
      if (date.getMonth() !== month) button.classList.add('fui-calendar-other-month');
      if (date.getDay() === 0) button.classList.add('fui-calendar-sunday');
      if (date.getDay() === 6) button.classList.add('fui-calendar-saturday');
      if (isSameDatePopupDate(date, today)) button.classList.add('fui-calendar-today');
      if (isSameDatePopupDate(date, this.selectedDate)) {
        button.classList.add('fui-calendar-selected');
        button.setAttribute('aria-selected', 'true');
      }
      if (!valid) {
        button.disabled = true;
        button.classList.add('fui-calendar-disabled');
      }
      cell.appendChild(button);
      row.appendChild(cell);
      cursor.setDate(cursor.getDate() + 1);
    }
    body.appendChild(row);
  }
  table.appendChild(body);
  this.calendarBody.textContent = '';
  this.calendarBody.appendChild(table);
  this._renderMonthMenu();
  this.menuVisible = this.options.calendarMode === 'months' || this.menuVisible;
  this.calendarMenu.hidden = !this.menuVisible;
  this.calendarBody.hidden = this.menuVisible;
  this._renderButtons();
  if (typeof this.options.onNavigate === 'function') {
    this.options.onNavigate.call(
      this.options.owner || this.calendar,
      year,
      month + 1,
      this
    );
  }
  return this;
};

DatePopup.prototype._renderMonthMenu = function() {
  var yearRow = document.createElement('div');
  var yearInput = document.createElement('input');
  var previousYear = document.createElement('button');
  var nextYear = document.createElement('button');
  var grid = document.createElement('div');
  var index;
  var button;
  yearRow.className = 'fui-calendar-menu-year-row';
  yearInput.className = 'fui-calendar-menu-year';
  yearInput.type = 'number';
  yearInput.min = '1';
  yearInput.max = '9999';
  yearInput.value = this.viewDate.getFullYear();
  yearInput.setAttribute('aria-label', this.options.yearText);
  previousYear.type = 'button';
  previousYear.className = 'fui-calendar-menu-year-nav fui-calendar-menu-prevyear';
  previousYear.setAttribute('aria-label', this.options.previousYearText);
  previousYear.setAttribute('data-year-offset', '-1');
  nextYear.type = 'button';
  nextYear.className = 'fui-calendar-menu-year-nav fui-calendar-menu-nextyear';
  nextYear.setAttribute('aria-label', this.options.nextYearText);
  nextYear.setAttribute('data-year-offset', '1');
  yearRow.appendChild(previousYear);
  yearRow.appendChild(yearInput);
  yearRow.appendChild(nextYear);
  grid.className = 'fui-calendar-menu-months';
  for (index = 0; index < 12; index += 1) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'fui-calendar-menu-month';
    button.textContent = this.options.months[index];
    button.setAttribute('data-month', index);
    if (this.selectedDate &&
      this.selectedDate.getFullYear() === this.viewDate.getFullYear() &&
      this.selectedDate.getMonth() === index) {
      button.classList.add('fui-calendar-menu-month-selected');
      button.setAttribute('aria-selected', 'true');
    }
    if (!this.options.validator.call(
      this.options.validatorContext,
      new Date(this.viewDate.getFullYear(), index, 1)
    )) {
      button.disabled = true;
      button.classList.add('fui-calendar-menu-month-disabled');
    }
    grid.appendChild(button);
  }
  this.calendarMenu.textContent = '';
  this.calendarMenu.appendChild(yearRow);
  this.calendarMenu.appendChild(grid);
};

DatePopup.prototype._renderButtons = function() {
  var buttons = Array.isArray(this.options.buttons) ? this.options.buttons : [
    {
      text: this.options.calendarMode === 'months' ?
        this.options.currentMonthText :
        this.options.currentText,
      action: 'today'
    },
    { text: this.options.closeText, action: 'close' }
  ];
  var index;
  var button;
  var descriptor;
  this.buttonDescriptors = buttons.slice();
  this.buttonBar.textContent = '';
  this.buttonBar.hidden = buttons.length === 0;
  for (index = 0; index < buttons.length; index += 1) {
    descriptor = buttons[index] || {};
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'fui-datebox-button';
    button.textContent = typeof descriptor.text === 'function' ?
      descriptor.text(this.options.validatorContext) :
      String(descriptor.text || '');
    button.setAttribute('data-button-index', index);
    this.buttonBar.appendChild(button);
  }
};

DatePopup.prototype._handleClick = function(event) {
  var nav = event.target.closest('[data-month-offset]');
  var yearNav = event.target.closest('[data-year-offset]');
  var day = event.target.closest('[data-date]');
  var month = event.target.closest('[data-month]');
  var footer = event.target.closest('[data-button-index]');
  var yearInput;
  var descriptor;
  if (yearNav) {
    yearInput = this.calendarMenu.querySelector('.fui-calendar-menu-year');
    this.viewDate = new Date(
      (parseInt(yearInput.value, 10) || this.viewDate.getFullYear()) +
        Number(yearNav.getAttribute('data-year-offset')),
      this.viewDate.getMonth(),
      1
    );
    this.render();
    return;
  }
  if (nav) {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + Number(nav.getAttribute('data-month-offset')),
      1
    );
    this.render();
    return;
  }
  if (event.target === this.calendarTitle) {
    if (this.options.calendarMode === 'months') return;
    this.menuVisible = !this.menuVisible;
    this.calendarMenu.hidden = !this.menuVisible;
    this.calendarBody.hidden = this.menuVisible;
    return;
  }
  if (month) {
    yearInput = this.calendarMenu.querySelector('.fui-calendar-menu-year');
    this.viewDate = new Date(
      parseInt(yearInput.value, 10) || this.viewDate.getFullYear(),
      Number(month.getAttribute('data-month')),
      1
    );
    if (this.options.calendarMode === 'months' && !month.disabled) {
      this.select(this.viewDate);
      return;
    }
    this.menuVisible = false;
    this.calendarMenu.hidden = true;
    this.calendarBody.hidden = false;
    this.render();
    return;
  }
  if (day && !day.disabled) {
    this.select(parseDatePopupIso(day.getAttribute('data-date')));
    return;
  }
  if (!footer) return;
  descriptor = this.buttonDescriptors[Number(footer.getAttribute('data-button-index'))] || {};
  if (typeof descriptor.handler === 'function') {
    descriptor.handler.call(
      footer,
      this.options.validatorContext,
      this.options.owner || this
    );
  } else if (descriptor.action === 'today') {
    this.select(toDatePopupDateOnly(new Date()));
  } else if (descriptor.action === 'close') {
    this.hide();
  }
};

DatePopup.prototype.select = function(date) {
  var value = cloneDatePopupDate(date);
  var oldValue = cloneDatePopupDate(this.selectedDate);
  if (!value || !this.options.validator.call(this.options.validatorContext, value)) return this;
  this.selectedDate = toDatePopupDateOnly(value);
  this.viewDate = cloneDatePopupDate(this.selectedDate);
  this.render();
  if (typeof this.options.onSelect === 'function') {
    this.options.onSelect(cloneDatePopupDate(this.selectedDate), this);
  }
  if (!isSameDatePopupDate(oldValue, this.selectedDate) &&
    typeof this.options.onChange === 'function') {
    this.options.onChange(
      cloneDatePopupDate(this.selectedDate),
      oldValue,
      this
    );
  }
  if (this.visible && !this.options.embedded) this.hide();
  return this;
};

DatePopup.prototype.moveTo = function(date) {
  var value = cloneDatePopupDate(date);
  var oldValue = cloneDatePopupDate(this.selectedDate);
  if (!value) {
    this.selectedDate = null;
    this.viewDate = toDatePopupDateOnly(new Date());
  } else {
    value = toDatePopupDateOnly(value);
    if (!this.options.validator.call(this.options.validatorContext, value)) return this;
    this.selectedDate = value;
    this.viewDate = cloneDatePopupDate(value);
  }
  this.render();
  if (!isSameDatePopupDate(oldValue, this.selectedDate) &&
    typeof this.options.onChange === 'function') {
    this.options.onChange(
      cloneDatePopupDate(this.selectedDate),
      oldValue,
      this
    );
  }
  return this;
};

DatePopup.prototype.resize = function(param) {
  var width;
  var height;
  param = param || {};
  if (Object.prototype.hasOwnProperty.call(param, 'width')) this.options.panelWidth = param.width;
  if (Object.prototype.hasOwnProperty.call(param, 'height')) this.options.panelHeight = param.height;
  if (!this.options.embedded) return this.position();
  width = this.options.panelWidth;
  height = this.options.panelHeight;
  this.panel.style.width = width === 'auto' || width == null ?
    '' :
    (typeof width === 'number' ? Math.max(0, width) + 'px' : String(width));
  this.panel.style.height = height === 'auto' || height == null ?
    '' :
    (typeof height === 'number' ? Math.max(0, height) + 'px' : String(height));
  return this;
};

DatePopup.prototype.handleKeyDown = function(event) {
  var key = event.key;
  var current;
  if ((key === 'ArrowDown' && (event.altKey || event.metaKey)) || key === 'F4') {
    event.preventDefault();
    this.show();
    return true;
  }
  if (!this.visible && !this.options.embedded) return false;
  if (key === 'Escape') {
    if (this.options.embedded && this.menuVisible) {
      event.preventDefault();
      this.menuVisible = false;
      this.calendarMenu.hidden = true;
      this.calendarBody.hidden = false;
      return true;
    }
    if (this.options.embedded) return false;
    event.preventDefault();
    this.hide();
    return true;
  }
  if (key === 'Enter') {
    event.preventDefault();
    this.select(this.viewDate);
    return true;
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].indexOf(key) < 0) {
    return false;
  }
  event.preventDefault();
  current = cloneDatePopupDate(this.viewDate) || toDatePopupDateOnly(new Date());
  if (this.options.calendarMode === 'months') {
    if (key === 'ArrowLeft') current.setMonth(current.getMonth() - 1);
    if (key === 'ArrowRight') current.setMonth(current.getMonth() + 1);
    if (key === 'ArrowUp') current.setMonth(current.getMonth() - 4);
    if (key === 'ArrowDown') current.setMonth(current.getMonth() + 4);
    if (key === 'PageUp') current.setFullYear(current.getFullYear() - 1);
    if (key === 'PageDown') current.setFullYear(current.getFullYear() + 1);
  } else {
    if (key === 'ArrowLeft') current.setDate(current.getDate() - 1);
    if (key === 'ArrowRight') current.setDate(current.getDate() + 1);
    if (key === 'ArrowUp') current.setDate(current.getDate() - 7);
    if (key === 'ArrowDown') current.setDate(current.getDate() + 7);
    if (key === 'PageUp') current.setMonth(current.getMonth() - 1);
    if (key === 'PageDown') current.setMonth(current.getMonth() + 1);
  }
  this.viewDate = current;
  this.render();
  return true;
};

DatePopup.prototype.show = function() {
  var openClassHost;
  if (this.options.embedded) return this;
  if (this.destroyed || this.visible) return this;
  if (activeDatePopup && activeDatePopup !== this) activeDatePopup.hide();
  this._normalizeOptions();
  this._applyThemeClasses();
  if (this.sharedCalendarState) this.panel.insertBefore(this.calendar, this.buttonBar);
  this.calendar.__fabuiDatePopupOwner = this;
  this.menuVisible = this.options.calendarMode === 'months';
  this.render();
  this.visible = true;
  this.panel.hidden = false;
  this._bindOpenEvents();
  this._startThemeObserver();
  activeDatePopup = this;
  openClassHost = resolveDatePopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.add('fui-datebox-open');
  this.position();
  if (typeof this.options.onShow === 'function') this.options.onShow(this);
  return this;
};

DatePopup.prototype.hide = function() {
  var openClassHost;
  if (this.options.embedded) return this;
  if (!this.visible) return this;
  this.visible = false;
  this.panel.hidden = true;
  this._unbindOpenEvents();
  this._stopThemeObserver();
  if (activeDatePopup === this) activeDatePopup = null;
  openClassHost = resolveDatePopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.remove('fui-datebox-open');
  if (this.sharedCalendarState && this.sharedCalendarState.host) {
    this.sharedCalendarState.host.appendChild(this.calendar);
  }
  if (typeof this.options.onHide === 'function') this.options.onHide(this);
  return this;
};

DatePopup.prototype.toggle = function() {
  return this.visible ? this.hide() : this.show();
};

DatePopup.prototype.isOpen = function() {
  return this.options.embedded ? !this.destroyed : this.visible;
};

DatePopup.prototype.position = function() {
  var anchor = resolveDatePopupElement(this.options.anchor);
  var rect;
  var width;
  var height;
  var top;
  var left;
  var availableWidth;
  if (!this.visible || !anchor) return this;
  rect = anchor.getBoundingClientRect();
  width = this.options.panelWidth === 'auto' ?
    rect.width :
    parseFloat(this.options.panelWidth) || 250;
  if (this.options.showLunar && this.options.calendarMode === 'days') {
    availableWidth = Math.max(250, document.documentElement.clientWidth - 12);
    width = Math.min(Math.max(420, width), availableWidth);
  }
  this.panel.style.width = Math.round(width) + 'px';
  this.panel.style.height = this.options.panelHeight === 'auto' ?
    'auto' :
    (typeof this.options.panelHeight === 'number' ?
      this.options.panelHeight + 'px' :
      String(this.options.panelHeight));
  height = this.panel.offsetHeight;
  top = rect.bottom + window.pageYOffset;
  left = rect.left + window.pageXOffset;
  if (rect.bottom + height > document.documentElement.clientHeight && rect.top > height) {
    top = rect.top + window.pageYOffset - height;
  }
  if (left + width > window.pageXOffset + document.documentElement.clientWidth) {
    left = Math.max(
      window.pageXOffset,
      window.pageXOffset + document.documentElement.clientWidth - width
    );
  }
  this.panel.style.left = Math.round(left) + 'px';
  this.panel.style.top = Math.round(top) + 'px';
  return this;
};

DatePopup.prototype.destroy = function() {
  if (this.destroyed) return;
  this.hide();
  this._stopThemeObserver();
  this.destroyed = true;
  this.panel.removeEventListener('click', this._onPanelClick);
  this.panel.removeEventListener('mousedown', this._onPanelMouseDown);
  this.panel.removeEventListener('change', this._onPanelChange);
  this._unbindOpenEvents();
  if (this.sharedCalendarState && this.sharedCalendarState.host &&
    this.calendar.parentNode !== this.sharedCalendarState.host) {
    this.sharedCalendarState.host.appendChild(this.calendar);
  }
  if (!this.sharedCalendarState && this.calendar.__fabuiDatePopupOwner === this) {
    this.calendar.__fabuiDatePopupOwner = null;
  }
  if (this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
};
