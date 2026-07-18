(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black'
  ];

  function formatDate(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + '-' +
      (month < 10 ? '0' : '') + month + '-' +
      (day < 10 ? '0' : '') + day;
  }

  function mountCalendarDemo(fabui) {
    var themeSelect = document.getElementById('calendar-theme');
    var localeSelect = document.getElementById('calendar-locale');
    var status = document.getElementById('calendar-status');
    var calendars = [];
    var locale = localeSelect.value;

    function log(message) {
      status.textContent = message;
    }

    function onSelect(date) {
      log('選取日期：' + formatDate(date));
    }

    function create(selector, options) {
      var calendar = new fabui.Calendar(selector, options);
      calendars.push(calendar);
      return calendar;
    }

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      calendars.forEach(function(calendar) {
        calendar.setTheme('inherit');
      });
    }

    function applyLocale(value) {
      locale = value;
      calendars.forEach(function(calendar) {
        calendar.setLocale(value);
      });
      log('語系：' + value);
    }

    if (!fabui || typeof fabui.Calendar !== 'function') {
      throw new Error('fabui.Calendar class is unavailable.');
    }

    create('#calendar-basic', {
      locale: locale,
      onSelect: onSelect
    });

    create('#calendar-week', {
      width: 250,
      height: 250,
      locale: locale,
      showWeek: true,
      weekNumberHeader: 'Wk',
      onSelect: onSelect
    });

    create('#calendar-custom', {
      width: 250,
      height: 250,
      locale: locale,
      firstDay: 1,
      formatter: function(date) {
        return date.getDate() === 1 ? '1★' : date.getDate();
      },
      styler: function(date) {
        if (date.getDay() === 0) {
          return {
            class: 'calendar-demo-holiday',
            style: 'font-weight:bold'
          };
        }
        return '';
      },
      validator: function(date) {
        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return date >= today;
      },
      onSelect: onSelect
    });

    create('#calendar-lunar', {
      width: 482,
      height: 500,
      locale: 'zh-TW',
      showLunar: true,
      onSelect: onSelect
    });

    create('#calendar-fluid', {
      width: '100%',
      height: 300,
      fit: true,
      locale: locale,
      onSelect: onSelect
    });

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
      log('主題：' + themeSelect.value);
    });
    localeSelect.addEventListener('change', function() {
      applyLocale(localeSelect.value);
    });
    document.getElementById('calendar-today').addEventListener('click', function() {
      calendars[0].moveTo(new Date());
      log('Basic Calendar 已移至今天');
    });
    document.getElementById('calendar-july').addEventListener('click', function() {
      calendars[0].moveTo(new Date(2026, 6, 18));
      log('Basic Calendar 已移至 2026-07-18');
    });

    applyTheme(themeSelect.value);
    global.fabCalendarDemo = {
      calendars: calendars
    };
    log('Calendar Demo 已就緒');
  }

  global.mountFabUICalendarDemo = mountCalendarDemo;
}(typeof window !== 'undefined' ? window : this));
