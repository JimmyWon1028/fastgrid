export function createDateBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.DateBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.datebox || null;

  var localePacks = {
    en: {
      currentText: 'Today',
      closeText: 'Close',
      okText: 'Ok',
      weeks: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    'zh-TW': {
      currentText: '今天',
      closeText: '關閉',
      okText: '確定',
      weeks: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    },
    'zh-CN': {
      currentText: '今天',
      closeText: '关闭',
      okText: '确定',
      weeks: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    }
  };

  var dateDefaults = {
    panelWidth: 250,
    panelHeight: 'auto',
    locale: 'en',
    firstDay: 0,
    showWeek: false,
    weekNumberHeader: '',
    currentText: null,
    closeText: null,
    okText: null,
    weeks: null,
    months: null,
    buttons: null,
    sharedCalendar: null,
    validator: null,
    formatter: null,
    parser: null,
    mask: '9999/99/99',
    autoUnmask: null,
    maskValueIncludesLiterals: null,
    onSelect: null,
    onChange: null,
    onShowPanel: null,
    onHidePanel: null,
    editorType: 'datebox',
    calendarMode: 'days'
  };

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

  function resolveElement(element) {
    return typeof element === 'string' ? document.querySelector(element) : element;
  }

  function cssSize(value, fallback) {
    if (value == null || value === '') return fallback + 'px';
    return typeof value === 'number' ? value + 'px' : String(value);
  }

  function cloneDate(date) {
    return date instanceof Date && isFinite(date.getTime()) ? new Date(date.getTime()) : null;
  }

  function dateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function sameDate(left, right) {
    return Boolean(left && right) && left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  }

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function defaultFormatter(date) {
    return pad(date.getMonth() + 1) + '/' + pad(date.getDate()) + '/' + date.getFullYear();
  }

  function defaultParser(value) {
    var text = value == null ? '' : String(value).trim();
    var parts;
    var year;
    var month;
    var day;
    var parsed;
    if (!text) return dateOnly(new Date());
    parts = text.split('/');
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      parsed = new Date(year, month - 1, day);
      if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
        return parsed;
      }
    }
    return dateOnly(new Date());
  }

  function readElementOptions(element) {
    var options = {};
    var panelWidth = element.getAttribute('panelWidth');
    var panelHeight = element.getAttribute('panelHeight');
    var firstDay = element.getAttribute('firstDay');
    var locale = element.getAttribute('locale');
    if (panelWidth != null && panelWidth !== '') options.panelWidth = isFinite(Number(panelWidth)) ? Number(panelWidth) : panelWidth;
    if (panelHeight != null && panelHeight !== '') options.panelHeight = isFinite(Number(panelHeight)) ? Number(panelHeight) : panelHeight;
    if (firstDay != null && firstDay !== '') options.firstDay = Number(firstDay);
    if (locale) options.locale = locale;
    return options;
  }

  function normalizeLocale(name) {
    if (localePacks[name]) return name;
    if (/^zh(?:-|_)?tw/i.test(name || '')) return 'zh-TW';
    if (/^zh/i.test(name || '')) return 'zh-CN';
    return 'en';
  }

  function CalendarController(owner) {
    this.owner = owner;
    this.element = owner._calendar;
  }

  CalendarController.prototype.options = function(options) {
    if (!options) {
      return {
        current: cloneDate(this.owner._viewDate),
        selected: cloneDate(this.owner._selectedDate),
        firstDay: this.owner._options.firstDay,
        weeks: this.owner._options.weeks.slice(),
        months: this.owner._options.months.slice(),
        showWeek: this.owner._options.showWeek,
        validator: this.owner._options.validator
      };
    }
    assign(this.owner._options, options);
    this.owner._normalizeCalendarOptions();
    this.owner._renderCalendar();
    return this;
  };

  CalendarController.prototype.moveTo = function(date) {
    var value = cloneDate(date);
    if (value) {
      this.owner._viewDate = dateOnly(value);
      this.owner._renderCalendar();
    }
    return this;
  };

  CalendarController.prototype.select = function(date) {
    this.owner._selectDate(date);
    return this;
  };

  CalendarController.prototype.resize = function() {
    this.owner._positionPanel();
    return this;
  };

  function DateBox(element, options) {
    var source;
    var userOptions = options || {};
    var textOptions;
    var icons;
    var locale;
    var self = this;
    if (!(this instanceof DateBox)) return new DateBox(element, options);
    source = resolveElement(element);
    if (!source || !/^(INPUT|TEXTAREA)$/.test(source.tagName)) {
      throw new Error('fabui.DateBox requires an input or textarea element.');
    }
    if (source.__fabuiDateBox) return source.__fabuiDateBox;

    this._source = source;
    this._listeners = {};
    this._destroyed = false;
    this._panelVisible = false;
    this._hasCustomFormatter = typeof userOptions.formatter === 'function';
    this._hasCustomParser = typeof userOptions.parser === 'function';
    this._explicitMask = Object.prototype.hasOwnProperty.call(userOptions, 'mask');
    this._initialValue = Object.prototype.hasOwnProperty.call(userOptions, 'value') ? userOptions.value : source.value;
    this._options = assign({}, DateBox.defaults, readElementOptions(source), userOptions);
    this._editorDefinition = editorDefinitions[this._options.editorType] || editorDefinition;
    locale = localePacks[normalizeLocale(this._options.locale)];
    this._options.locale = normalizeLocale(this._options.locale);
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'currentText')) this._options.currentText = locale.currentText;
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'closeText')) this._options.closeText = locale.closeText;
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'okText')) this._options.okText = locale.okText;
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'weeks')) this._options.weeks = locale.weeks.slice();
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'months')) this._options.months = locale.months.slice();
    this._normalizeCalendarOptions();

    icons = Array.isArray(userOptions.icons) ? userOptions.icons.slice() : [];
    icons.push({
      iconCls: 'icon-datebox fui-datebox-trigger',
      align: 'right',
      width: userOptions.iconWidth || 18,
      title: 'Calendar',
      onClick: function() {
        self.togglePanel();
      }
    });
    textOptions = assign({}, userOptions, {
      cls: ((userOptions.cls || '') + ' fui-datebox').trim(),
      icons: icons,
      onChange: null
    });
    this._textbox = new TextBox(source, textOptions);
    this._editor = this._textbox.textbox();
    if (this._editorDefinition && this._editorDefinition.className) {
      this._editorDefinition.className.split(/\s+/).forEach(function(className) {
        if (className) this._editor.classList.add(className);
      }, this);
    } else {
      this._editor.classList.add('textbox-f', 'datebox-f', 'fg-editor-datebox');
    }
    this._editor.inputMode = this._editorDefinition && this._editorDefinition.inputMode ? this._editorDefinition.inputMode : 'numeric';
    this._field = this._editor.closest('.fui-textbox-field');
    this._shell = this._editor.closest('.fui-textbox');
    this._buildPanel();
    this._configureSharedCalendar();
    this._bind();
    source.__fabuiDateBox = this;
    this.initValue(this._initialValue);
  }

  DateBox.prototype._normalizeCalendarOptions = function() {
    var self = this;
    var definition = this._editorDefinition;
    this._options.firstDay = Math.max(0, Math.min(6, parseInt(this._options.firstDay, 10) || 0));
    this._options.weeks = Array.isArray(this._options.weeks) && this._options.weeks.length === 7 ? this._options.weeks.slice() : localePacks.en.weeks.slice();
    this._options.months = Array.isArray(this._options.months) && this._options.months.length === 12 ? this._options.months.slice() : localePacks.en.months.slice();
    this._options.formatter = typeof this._options.formatter === 'function' ? this._options.formatter : (definition && typeof definition.format === 'function' ? function(date) {
      return definition.format(date, self._options || {});
    } : defaultFormatter);
    this._options.parser = typeof this._options.parser === 'function' ? this._options.parser : (definition && typeof definition.parse === 'function' ? function(value) {
      return definition.parse(value, self._options || {});
    } : defaultParser);
    this._options.validator = typeof this._options.validator === 'function' ? this._options.validator : function() { return true; };
  };

  DateBox.prototype._buildPanel = function() {
    var panel = document.createElement('div');
    var calendar = document.createElement('div');
    var header = document.createElement('div');
    var title = document.createElement('button');
    var body = document.createElement('div');
    var menu = document.createElement('div');
    var footer = document.createElement('div');
    var nav = [
      ['fui-calendar-prevyear', 'Previous year', -12],
      ['fui-calendar-prevmonth', 'Previous month', -1],
      ['fui-calendar-nextmonth', 'Next month', 1],
      ['fui-calendar-nextyear', 'Next year', 12]
    ];
    var index;
    var button;
    panel.className = 'fui-datebox-panel fui-' + this._options.editorType + '-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
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
    document.body.appendChild(panel);
    this._panel = panel;
    this._calendar = calendar;
    this._calendarHeader = header;
    this._calendarTitle = title;
    this._calendarBody = body;
    this._calendarMenu = menu;
    this._buttonBar = footer;
    this._viewDate = dateOnly(new Date());
    this._selectedDate = null;
    this._calendarController = new CalendarController(this);
    this._renderButtons();
    this._renderCalendar();
  };

  DateBox.prototype._configureSharedCalendar = function() {
    var host = resolveElement(this._options.sharedCalendar);
    var state;
    var self = this;
    if (host) {
      state = host.__fabuiDateBoxSharedCalendar;
      if (state) {
        if (this._calendar.parentNode) this._calendar.parentNode.removeChild(this._calendar);
        this._calendar = state.calendar;
        this._calendarHeader = this._calendar.querySelector('.fui-calendar-header');
        this._calendarTitle = this._calendar.querySelector('.fui-calendar-title');
        this._calendarBody = this._calendar.querySelector('.fui-calendar-body');
        this._calendarMenu = this._calendar.querySelector('.fui-calendar-menu');
      } else {
        state = { calendar: this._calendar, host: host };
        host.__fabuiDateBoxSharedCalendar = state;
        host.classList.add('fui-datebox-shared-calendar');
        host.appendChild(this._calendar);
      }
      this._sharedCalendarState = state;
    }
    this._calendarController = new CalendarController(this);
    if (!this._calendar.__fabuiDateBoxClickBound) {
      this._calendar.addEventListener('click', function(event) {
        var owner = self._calendar.__fabuiDateBoxOwner;
        if (owner && !owner._destroyed) owner._handleCalendarClick(event);
      });
      this._calendar.__fabuiDateBoxClickBound = true;
    }
    this._calendar.__fabuiDateBoxOwner = this;
    this._renderCalendar();
  };

  DateBox.prototype._bind = function() {
    var self = this;
    this._onInputKeyDown = function(event) { self._handleKeyDown(event); };
    this._onInput = function() { self._handleInput(); };
    this._onCopy = function(event) { self._handleCopy(event); };
    this._onInputBlur = function() {
      window.setTimeout(function() {
        if (!self._destroyed && !self._panel.contains(document.activeElement)) self.fix();
      }, 0);
    };
    this._onPanelMouseDown = function(event) {
      if (!event.target.closest('input')) event.preventDefault();
    };
    this._onPanelClick = function(event) {
      if (!self._calendar.contains(event.target)) self._handleCalendarClick(event);
    };
    this._onDocumentMouseDown = function(event) {
      if (self._panelVisible && !self._panel.contains(event.target) && !self._field.contains(event.target)) self.hidePanel();
    };
    this._onDocumentKeyDown = function(event) {
      if (!self._panelVisible || event.key !== 'Escape') return;
      event.preventDefault();
      self.hidePanel();
    };
    this._onWindowResize = function() { if (self._panelVisible) self._positionPanel(); };
    this._onWindowScroll = function() { if (self._panelVisible) self._positionPanel(); };
    this._onFormReset = function() {
      window.setTimeout(function() { if (!self._destroyed) self.reset(); }, 0);
    };
    this._editor.addEventListener('keydown', this._onInputKeyDown);
    this._editor.addEventListener('input', this._onInput);
    this._editor.addEventListener('copy', this._onCopy);
    this._editor.addEventListener('blur', this._onInputBlur);
    this._panel.addEventListener('mousedown', this._onPanelMouseDown);
    this._panel.addEventListener('click', this._onPanelClick);
    document.addEventListener('mousedown', this._onDocumentMouseDown);
    document.addEventListener('keydown', this._onDocumentKeyDown);
    window.addEventListener('resize', this._onWindowResize);
    window.addEventListener('scroll', this._onWindowScroll, true);
    if (this._source.form) this._source.form.addEventListener('reset', this._onFormReset);
  };

  DateBox.prototype._renderCalendar = function() {
    var year = this._viewDate.getFullYear();
    var month = this._viewDate.getMonth();
    var first = new Date(year, month, 1);
    var offset = (first.getDay() - this._options.firstDay + 7) % 7;
    var cursor = new Date(year, month, 1 - offset);
    var today = dateOnly(new Date());
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
    this._calendarTitle.textContent = this._options.calendarMode === 'months' ? String(year) : this._options.months[month] + ' ' + year;
    table.setAttribute('role', 'grid');
    if (this._options.showWeek) {
      cell = document.createElement('th');
      cell.className = 'fui-calendar-week-number';
      cell.textContent = this._options.weekNumberHeader || '';
      row.appendChild(cell);
    }
    for (index = 0; index < 7; index += 1) {
      cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = this._options.weeks[(this._options.firstDay + index) % 7];
      row.appendChild(cell);
    }
    head.appendChild(row);
    table.appendChild(head);
    for (index = 0; index < 6; index += 1) {
      row = document.createElement('tr');
      if (this._options.showWeek) {
        cell = document.createElement('td');
        cell.className = 'fui-calendar-week-number';
        cell.textContent = this._weekNumber(cursor);
        row.appendChild(cell);
      }
      for (dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
        valid = this._options.validator.call(this._source, date);
        cell = document.createElement('td');
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'fui-calendar-day';
        button.textContent = date.getDate();
        button.setAttribute('data-date', date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()));
        button.setAttribute('aria-label', defaultFormatter(date));
        if (date.getMonth() !== month) button.classList.add('fui-calendar-other-month');
        if (date.getDay() === 0) button.classList.add('fui-calendar-sunday');
        if (date.getDay() === 6) button.classList.add('fui-calendar-saturday');
        if (sameDate(date, today)) button.classList.add('fui-calendar-today');
        if (sameDate(date, this._selectedDate)) {
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
    this._calendarBody.textContent = '';
    this._calendarBody.appendChild(table);
    this._renderMonthMenu();
    if (this._options.calendarMode === 'months') {
      this._calendarMenu.hidden = false;
      this._calendarBody.hidden = true;
    }
  };

  DateBox.prototype._weekNumber = function(date) {
    var current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = current.getUTCDay() || 7;
    var yearStart;
    current.setUTCDate(current.getUTCDate() + 4 - day);
    yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    return Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  };

  DateBox.prototype._renderMonthMenu = function() {
    var yearRow = document.createElement('div');
    var yearInput = document.createElement('input');
    var grid = document.createElement('div');
    var index;
    var button;
    yearRow.className = 'fui-calendar-menu-year-row';
    yearInput.className = 'fui-calendar-menu-year';
    yearInput.type = 'number';
    yearInput.value = this._viewDate.getFullYear();
    yearInput.setAttribute('aria-label', 'Year');
    yearRow.appendChild(yearInput);
    grid.className = 'fui-calendar-menu-months';
    for (index = 0; index < 12; index += 1) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'fui-calendar-menu-month';
      button.textContent = this._options.months[index];
      button.setAttribute('data-month', index);
      if (this._selectedDate && this._selectedDate.getFullYear() === this._viewDate.getFullYear() && this._selectedDate.getMonth() === index) {
        button.classList.add('fui-calendar-menu-month-selected');
        button.setAttribute('aria-selected', 'true');
      }
      if (!this._options.validator.call(this._source, new Date(this._viewDate.getFullYear(), index, 1))) {
        button.disabled = true;
        button.classList.add('fui-calendar-menu-month-disabled');
      }
      grid.appendChild(button);
    }
    this._calendarMenu.textContent = '';
    this._calendarMenu.appendChild(yearRow);
    this._calendarMenu.appendChild(grid);
  };

  DateBox.prototype._renderButtons = function() {
    var buttons = Array.isArray(this._options.buttons) ? this._options.buttons : [
      { text: this._options.currentText, action: 'today' },
      { text: this._options.closeText, action: 'close' }
    ];
    var index;
    var button;
    var descriptor;
    this._buttonDescriptors = buttons.slice();
    this._buttonBar.textContent = '';
    for (index = 0; index < buttons.length; index += 1) {
      descriptor = buttons[index] || {};
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'fui-datebox-button';
      button.textContent = typeof descriptor.text === 'function' ? descriptor.text(this._source) : String(descriptor.text || '');
      button.setAttribute('data-button-index', index);
      this._buttonBar.appendChild(button);
    }
  };

  DateBox.prototype._handleCalendarClick = function(event) {
    var nav = event.target.closest('[data-month-offset]');
    var day = event.target.closest('[data-date]');
    var month = event.target.closest('[data-month]');
    var footer = event.target.closest('[data-button-index]');
    var yearInput;
    var date;
    var descriptor;
    if (nav) {
      this._moveMonth(Number(nav.getAttribute('data-month-offset')));
      return;
    }
    if (event.target === this._calendarTitle) {
      if (this._options.calendarMode === 'months') return;
      this._calendarMenu.hidden = !this._calendarMenu.hidden;
      this._calendarBody.hidden = !this._calendarMenu.hidden;
      return;
    }
    if (month) {
      yearInput = this._calendarMenu.querySelector('.fui-calendar-menu-year');
      this._viewDate = new Date(parseInt(yearInput.value, 10) || this._viewDate.getFullYear(), Number(month.getAttribute('data-month')), 1);
      if (this._options.calendarMode === 'months' && !month.disabled) {
        this._selectDate(this._viewDate);
        return;
      }
      this._calendarMenu.hidden = true;
      this._calendarBody.hidden = false;
      this._renderCalendar();
      return;
    }
    if (day && !day.disabled) {
      date = this._parseIsoDate(day.getAttribute('data-date'));
      this._selectDate(date);
      return;
    }
    if (footer) {
      descriptor = this._buttonDescriptors[Number(footer.getAttribute('data-button-index'))] || {};
      if (typeof descriptor.handler === 'function') {
        descriptor.handler.call(footer, this._source, this);
      } else if (descriptor.action === 'today') {
        this._selectDate(dateOnly(new Date()));
      } else if (descriptor.action === 'close') {
        this.hidePanel();
      }
    }
  };

  DateBox.prototype._handleKeyDown = function(event) {
    var key = event.key;
    var current;
    var definition = this._editorDefinition;
    if ((key === 'Backspace' || key === 'Delete') && definition && typeof definition.handleDelete === 'function' && !this._hasCustomFormatter && !this._hasCustomParser) {
      event.preventDefault();
      definition.handleDelete(this._editor, key, this._options);
      this._handleInput();
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && key.length === 1 && definition && typeof definition.isTextAllowed === 'function') {
      if (!definition.isTextAllowed(this._editor, key, this._options)) event.preventDefault();
      return;
    }
    if ((key === 'ArrowDown' && (event.altKey || event.metaKey)) || key === 'F4') {
      event.preventDefault();
      this.showPanel();
      return;
    }
    if (key === 'Escape' && this._panelVisible) {
      event.preventDefault();
      this.hidePanel();
      return;
    }
    if (key === 'Enter') {
      event.preventDefault();
      if (this._panelVisible) {
        this._selectDate(this._viewDate);
      } else {
        this.fix();
      }
      return;
    }
    if (!this._panelVisible || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].indexOf(key) < 0) return;
    event.preventDefault();
    current = cloneDate(this._viewDate) || dateOnly(new Date());
    if (this._options.calendarMode === 'months') {
      if (key === 'ArrowLeft') current.setMonth(current.getMonth() - 1);
      if (key === 'ArrowRight') current.setMonth(current.getMonth() + 1);
      if (key === 'ArrowUp') current.setMonth(current.getMonth() - 4);
      if (key === 'ArrowDown') current.setMonth(current.getMonth() + 4);
      if (key === 'PageUp') current.setFullYear(current.getFullYear() - 1);
      if (key === 'PageDown') current.setFullYear(current.getFullYear() + 1);
      this._viewDate = current;
      this._renderCalendar();
      return;
    }
    if (key === 'ArrowLeft') current.setDate(current.getDate() - 1);
    if (key === 'ArrowRight') current.setDate(current.getDate() + 1);
    if (key === 'ArrowUp') current.setDate(current.getDate() - 7);
    if (key === 'ArrowDown') current.setDate(current.getDate() + 7);
    if (key === 'PageUp') current.setMonth(current.getMonth() - 1);
    if (key === 'PageDown') current.setMonth(current.getMonth() + 1);
    this._viewDate = current;
    this._renderCalendar();
  };

  DateBox.prototype._handleInput = function() {
    var text;
    var dataValue;
    var definition = this._editorDefinition;
    if (!definition || typeof definition.sanitize !== 'function' || this._hasCustomFormatter || this._hasCustomParser) return;
    text = definition.sanitize(this._editor.value, this._options);
    if (text !== this._editor.value) {
      this._editor.value = text;
      if (this._editor.setSelectionRange) this._editor.setSelectionRange(text.length, text.length);
    }
    dataValue = definition.getDataValue(text, this._options);
    this._source.value = definition.parse(text, this._options) ? dataValue : text;
  };

  DateBox.prototype._handleCopy = function(event) {
    var start = this._editor.selectionStart;
    var end = this._editor.selectionEnd;
    var clipboardData;
    var text;
    var definition = this._editorDefinition;
    if (!this._explicitMask || !definition || typeof definition.getCopyText !== 'function' || start == null || end == null || start === end) return;
    text = definition.getCopyText(this._editor.value.slice(Math.min(start, end), Math.max(start, end)), this._options);
    clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.setData) return;
    clipboardData.setData('text/plain', text);
    event.preventDefault();
    event.stopPropagation();
  };

  DateBox.prototype._moveMonth = function(offset) {
    var date = new Date(this._viewDate.getFullYear(), this._viewDate.getMonth() + offset, 1);
    this._viewDate = date;
    this._renderCalendar();
  };

  DateBox.prototype._parseIsoDate = function(value) {
    var parts = String(value).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  };

  DateBox.prototype._selectDate = function(date) {
    var value = cloneDate(date);
    if (!value || !this._options.validator.call(this._source, value)) return this;
    this.setDate(value);
    if (typeof this._options.onSelect === 'function') this._options.onSelect.call(this._source, cloneDate(value));
    this._emit('select', { date: cloneDate(value) });
    this.hidePanel();
    return this;
  };

  DateBox.prototype._positionPanel = function() {
    var rect;
    var width;
    var height;
    var top;
    var left;
    if (!this._panelVisible) return;
    rect = this._shell.getBoundingClientRect();
    width = this._options.panelWidth === 'auto' ? rect.width : parseFloat(this._options.panelWidth) || 250;
    this._panel.style.width = cssSize(width, 250);
    this._panel.style.height = this._options.panelHeight === 'auto' ? 'auto' : cssSize(this._options.panelHeight, 290);
    height = this._panel.offsetHeight;
    top = rect.bottom + window.pageYOffset;
    left = rect.left + window.pageXOffset;
    if (rect.bottom + height > document.documentElement.clientHeight && rect.top > height) {
      top = rect.top + window.pageYOffset - height;
    }
    if (left + width > window.pageXOffset + document.documentElement.clientWidth) {
      left = Math.max(window.pageXOffset, window.pageXOffset + document.documentElement.clientWidth - width);
    }
    this._panel.style.left = Math.round(left) + 'px';
    this._panel.style.top = Math.round(top) + 'px';
  };

  DateBox.prototype._emit = function(name, detail) {
    var listeners = (this._listeners[name] || []).slice();
    listeners.forEach(function(listener) { listener(detail); });
  };

  DateBox.prototype.options = function() { return this._options; };
  DateBox.prototype.calendar = function() { return this._calendarController; };
  DateBox.prototype.panel = function() { return this._panel; };
  DateBox.prototype.textbox = function() { return this._editor; };
  DateBox.prototype.getIcon = function(index) { return this._textbox.getIcon(index); };
  DateBox.prototype.getText = function() { return this._editor.value; };
  DateBox.prototype.getValue = function() { return this._source.value; };
  DateBox.prototype.getDate = function() { return cloneDate(this._selectedDate); };

  DateBox.prototype.setText = function(value) {
    this._textbox.setValue(value == null ? '' : String(value), true);
    this._source.value = value == null ? '' : String(value);
    return this;
  };

  DateBox.prototype.setValue = function(value, silent) {
    var oldValue = this._lastCommittedValue || '';
    var text = value == null ? '' : String(value).trim();
    var date = null;
    var dataValue = '';
    if (text) date = cloneDate(this._options.parser.call(this._source, text));
    if (date) {
      date = dateOnly(date);
      text = String(this._options.formatter.call(this._source, date));
      dataValue = this._editorDefinition && typeof this._editorDefinition.getDataValue === 'function' ? this._editorDefinition.getDataValue(date, this._options) : text;
    } else {
      text = '';
    }
    this._selectedDate = date;
    if (date) this._viewDate = cloneDate(date);
    this._textbox.setValue(text, true);
    this._source.value = dataValue;
    this._options.value = dataValue;
    this._lastCommittedValue = dataValue;
    this._renderCalendar();
    if (!silent && dataValue !== oldValue) {
      if (typeof this._options.onChange === 'function') this._options.onChange.call(this, dataValue, oldValue);
      this._emit('change', { value: dataValue, oldValue: oldValue });
    }
    return this;
  };

  DateBox.prototype.setDate = function(date, silent) {
    var value = cloneDate(date);
    return this.setValue(value ? this._options.formatter.call(this._source, value) : '', silent);
  };

  DateBox.prototype.fix = function() { return this.setValue(this._editor.value); };

  DateBox.prototype.initValue = function(value) {
    this._initialValue = value == null ? '' : String(value);
    return this.setValue(this._initialValue, true);
  };

  DateBox.prototype.clear = function() { return this.setValue(''); };
  DateBox.prototype.reset = function() { return this.setValue(this._initialValue); };
  DateBox.prototype.focus = function() { this._textbox.focus(); return this; };

  DateBox.prototype.showPanel = function() {
    if (this._options.disabled || this._panelVisible) return this;
    if (this._editor.value) this.setValue(this._editor.value, true);
    if (this._sharedCalendarState) this._panel.insertBefore(this._calendar, this._buttonBar);
    this._calendar.__fabuiDateBoxOwner = this;
    this._renderCalendar();
    this._panelVisible = true;
    this._panel.hidden = false;
    this._shell.classList.add('fui-datebox-open');
    this._positionPanel();
    if (typeof this._options.onShowPanel === 'function') this._options.onShowPanel.call(this);
    this._emit('showPanel', { panel: this._panel });
    return this;
  };

  DateBox.prototype.hidePanel = function() {
    if (!this._panelVisible) return this;
    this._panelVisible = false;
    this._panel.hidden = true;
    this._shell.classList.remove('fui-datebox-open');
    if (this._sharedCalendarState && this._sharedCalendarState.host) {
      this._sharedCalendarState.host.appendChild(this._calendar);
    }
    if (typeof this._options.onHidePanel === 'function') this._options.onHidePanel.call(this);
    this._emit('hidePanel', { panel: this._panel });
    return this;
  };

  DateBox.prototype.togglePanel = function() {
    return this._panelVisible ? this.hidePanel() : this.showPanel();
  };

  DateBox.prototype.resize = function(width, height) {
    this._textbox.resize(width, height);
    this._options.width = this._textbox.options().width;
    this._options.height = this._textbox.options().height;
    this._positionPanel();
    return this;
  };

  DateBox.prototype.disable = function() { this.hidePanel(); this._textbox.disable(); this._options.disabled = true; return this; };
  DateBox.prototype.enable = function() { this._textbox.enable(); this._options.disabled = false; return this; };
  DateBox.prototype.readonly = function(mode) { this._textbox.readonly(mode); this._options.readonly = mode !== false; return this; };
  DateBox.prototype.setEditable = function(mode) { this._textbox.setEditable(mode); this._options.editable = mode !== false; return this; };

  DateBox.prototype.cloneFrom = function(from) {
    var source = from instanceof DateBox ? from : resolveElement(from);
    var instance = source instanceof DateBox ? source : source && source.__fabuiDateBox;
    if (!instance) throw new Error('fabui.DateBox cloneFrom requires another DateBox.');
    assign(this._options, instance.options());
    this._normalizeCalendarOptions();
    this._renderButtons();
    this.resize(this._options.width, this._options.height);
    return this.setValue(instance.getValue(), true);
  };

  DateBox.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  DateBox.prototype.off = function(name, listener) {
    var listeners = this._listeners[name];
    if (!listeners) return this;
    this._listeners[name] = listener ? listeners.filter(function(item) { return item !== listener; }) : [];
    return this;
  };

  DateBox.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._editor.removeEventListener('keydown', this._onInputKeyDown);
    this._editor.removeEventListener('input', this._onInput);
    this._editor.removeEventListener('copy', this._onCopy);
    this._editor.removeEventListener('blur', this._onInputBlur);
    this._panel.removeEventListener('mousedown', this._onPanelMouseDown);
    this._panel.removeEventListener('click', this._onPanelClick);
    document.removeEventListener('mousedown', this._onDocumentMouseDown);
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('scroll', this._onWindowScroll, true);
    if (this._source.form) this._source.form.removeEventListener('reset', this._onFormReset);
    if (this._sharedCalendarState && this._sharedCalendarState.host && this._calendar.parentNode !== this._sharedCalendarState.host) {
      this._sharedCalendarState.host.appendChild(this._calendar);
    }
    if (!this._sharedCalendarState && this._calendar.__fabuiDateBoxOwner === this) {
      this._calendar.__fabuiDateBoxOwner = null;
    }
    if (this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    delete this._source.__fabuiDateBox;
    this._textbox.destroy();
    this._listeners = {};
  };

  DateBox.defaults = assign({}, TextBox.defaults || {}, dateDefaults, localePacks.en, {
    formatter: editorDefinition ? null : defaultFormatter,
    parser: editorDefinition ? null : defaultParser
  });
  DateBox.editorDefinition = editorDefinition;
  DateBox.locales = localePacks;
  DateBox.addLocale = function(name, pack) {
    if (name && pack) localePacks[name] = assign({}, localePacks.en, pack);
    return DateBox;
  };
  return DateBox;
}
