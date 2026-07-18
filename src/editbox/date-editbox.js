import { DatePopup, normalizeDatePopupTheme } from './date-popup.js?v=20260718-final-audit-v1';
import { normalizeEditorIconDescriptors } from './editor-icons.js?v=20260718-editor-icons-v1';

export function createDateBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.DateBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.date || editorDefinitions.datebox || null;

  var localePacks = {
    en: {
      currentText: 'Today',
      closeText: 'Close',
      okText: 'Ok',
      yearText: 'Year',
      previousYearText: 'Previous year',
      nextYearText: 'Next year',
      weeks: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    'zh-TW': {
      currentText: '今天',
      closeText: '關閉',
      okText: '確定',
      yearText: '年份',
      previousYearText: '上一年',
      nextYearText: '下一年',
      weeks: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    },
    'zh-CN': {
      currentText: '今天',
      closeText: '关闭',
      okText: '确定',
      yearText: '年份',
      previousYearText: '上一年',
      nextYearText: '下一年',
      weeks: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    }
  };

  var dateDefaults = {
    iconWidth: 28,
    panelWidth: 250,
    panelHeight: 'auto',
    theme: 'inherit',
    locale: 'en',
    firstDay: 0,
    showWeek: false,
    showLunar: false,
    weekNumberHeader: '',
    currentText: null,
    closeText: null,
    okText: null,
    yearText: null,
    previousYearText: null,
    nextYearText: null,
    weeks: null,
    months: null,
    buttons: null,
    sharedCalendar: null,
    validator: null,
    formatter: null,
    parser: null,
    mask: '9999/99/99',
    autoUnmask: true,
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

  function cloneDate(date) {
    return date instanceof Date && isFinite(date.getTime()) ? new Date(date.getTime()) : null;
  }

  function dateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
    var showLunar = element.getAttribute('showLunar');
    var theme = element.getAttribute('theme');
    var locale = element.getAttribute('locale');
    if (panelWidth != null && panelWidth !== '') options.panelWidth = isFinite(Number(panelWidth)) ? Number(panelWidth) : panelWidth;
    if (panelHeight != null && panelHeight !== '') options.panelHeight = isFinite(Number(panelHeight)) ? Number(panelHeight) : panelHeight;
    if (firstDay != null && firstDay !== '') options.firstDay = Number(firstDay);
    if (showLunar != null) options.showLunar = showLunar !== 'false';
    if (theme) options.theme = theme;
    if (locale) options.locale = locale;
    return options;
  }

  function normalizeLocale(name) {
    if (localePacks[name]) return name;
    if (/^zh(?:-|_)?tw/i.test(name || '')) return 'zh-TW';
    if (/^zh/i.test(name || '')) return 'zh-CN';
    return 'en';
  }

  function isYearMonthMask(mask) {
    return /^9999[\/-]99$/.test(String(mask || ''));
  }

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
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'yearText')) this._options.yearText = locale.yearText;
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'previousYearText')) this._options.previousYearText = locale.previousYearText;
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'nextYearText')) this._options.nextYearText = locale.nextYearText;
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'weeks')) this._options.weeks = locale.weeks.slice();
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'months')) this._options.months = locale.months.slice();
    this._normalizeCalendarOptions();

    icons = normalizeEditorIconDescriptors(userOptions.icons);
    icons.push({
      iconCls: 'icon-datebox fui-datebox-trigger',
      align: 'right',
      width: this._options.iconWidth,
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
    this._bind();
    source.__fabuiDateBox = this;
    this.initValue(this._initialValue);
  }

  DateBox.prototype._normalizeCalendarOptions = function() {
    var self = this;
    var definition = this._editorDefinition;
    this._options.calendarMode = isYearMonthMask(this._options.mask) ?
      'months' :
      (this._options.calendarMode === 'months' ? 'months' : 'days');
    this._options.firstDay = Math.max(0, Math.min(6, parseInt(this._options.firstDay, 10) || 0));
    this._options.theme = this._options.theme === 'inherit' ?
      'inherit' :
      normalizeDatePopupTheme(this._options.theme);
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
    var self = this;
    this._viewDate = dateOnly(new Date());
    this._selectedDate = null;
    this._datePopup = new DatePopup({
      anchor: this._shell,
      className: 'fui-' + this._options.editorType + '-panel',
      theme: this._options.theme,
      themeSource: this._shell,
      openClassHost: this._shell,
      sharedCalendar: this._options.sharedCalendar,
      owner: this,
      containsTarget: function(target) {
        return self._field === target || self._field.contains(target);
      },
      onSelect: function(date) {
        self._selectDate(date);
      },
      onOptionsChange: function(options) {
        assign(self._options, options);
        self._normalizeCalendarOptions();
        self._syncDatePopup();
        return false;
      },
      onShow: function() {
        self._panelVisible = true;
        if (typeof self._options.onShowPanel === 'function') self._options.onShowPanel.call(self);
        self._emit('showPanel', { panel: self._panel });
      },
      onHide: function() {
        self._panelVisible = false;
        if (typeof self._options.onHidePanel === 'function') self._options.onHidePanel.call(self);
        self._emit('hidePanel', { panel: self._panel });
      }
    });
    this._panel = this._datePopup.panel;
    this._calendar = this._datePopup.calendar;
    this._calendarController = this._datePopup.controller;
    this._syncDatePopup();
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
    this._onFormReset = function() {
      window.setTimeout(function() { if (!self._destroyed) self.reset(); }, 0);
    };
    this._editor.addEventListener('keydown', this._onInputKeyDown);
    this._editor.addEventListener('input', this._onInput);
    this._editor.addEventListener('copy', this._onCopy);
    this._editor.addEventListener('blur', this._onInputBlur);
    if (this._source.form) this._source.form.addEventListener('reset', this._onFormReset);
  };

  DateBox.prototype._syncDatePopup = function() {
    this._datePopup.setOptions({
      anchor: this._shell,
      className: 'fui-' + this._options.editorType + '-panel',
      theme: this._options.theme,
      themeSource: this._shell,
      panelWidth: this._options.panelWidth,
      panelHeight: this._options.panelHeight,
      firstDay: this._options.firstDay,
      showWeek: this._options.showWeek,
      showLunar: this._options.showLunar,
      weekNumberHeader: this._options.weekNumberHeader,
      locale: this._options.locale,
      currentText: this._options.currentText,
      closeText: this._options.closeText,
      yearText: this._options.yearText,
      previousYearText: this._options.previousYearText,
      nextYearText: this._options.nextYearText,
      weeks: this._options.weeks,
      months: this._options.months,
      buttons: this._options.buttons,
      calendarMode: this._options.calendarMode,
      validator: this._options.validator,
      validatorContext: this._source
    });
    this._datePopup.setValue(this._selectedDate, this._viewDate);
    this._calendar = this._datePopup.calendar;
    this._calendarController = this._datePopup.controller;
  };

  DateBox.prototype._renderCalendar = function() {
    this._syncDatePopup();
  };

  DateBox.prototype._renderButtons = function() {
    this._syncDatePopup();
  };

  DateBox.prototype._handleKeyDown = function(event) {
    var key = event.key;
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
    if (this._datePopup.handleKeyDown(event)) return;
    if (key === 'Enter') {
      event.preventDefault();
      this.fix();
      return;
    }
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
    if (!definition || typeof definition.getCopyText !== 'function' || start == null || end == null || start === end) return;
    text = definition.getCopyText(this._editor.value.slice(Math.min(start, end), Math.max(start, end)), this._options);
    clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.setData) return;
    clipboardData.setData('text/plain', text);
    event.preventDefault();
    event.stopPropagation();
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
    this._datePopup.position();
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

  DateBox.prototype.setTheme = function(theme) {
    this._options.theme = theme === 'inherit' ? 'inherit' : normalizeDatePopupTheme(theme);
    this._syncDatePopup();
    return this;
  };

  DateBox.prototype.showPanel = function() {
    if (this._options.disabled || this._panelVisible) return this;
    if (this._editor.value) this.setValue(this._editor.value, true);
    this._renderCalendar();
    this._datePopup.show();
    return this;
  };

  DateBox.prototype.hidePanel = function() {
    this._datePopup.hide();
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
    if (this._source.form) this._source.form.removeEventListener('reset', this._onFormReset);
    this._datePopup.destroy();
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
