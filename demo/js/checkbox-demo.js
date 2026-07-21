(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];
  var TEXTS = {
    en: {
      ready: 'CheckBox Demo is ready',
      checked: 'Checked',
      unchecked: 'Unchecked',
      enabled: 'Enabled',
      disabled: 'Disabled',
      submitted: 'Submitted values: ',
      empty: '(none)'
    },
    'zh-TW': {
      ready: 'CheckBox Demo 已就緒',
      checked: '已勾選',
      unchecked: '未勾選',
      enabled: '已啟用',
      disabled: '已停用',
      submitted: '送出值：',
      empty: '（無）'
    },
    'zh-CN': {
      ready: 'CheckBox Demo 已就绪',
      checked: '已勾选',
      unchecked: '未勾选',
      enabled: '已启用',
      disabled: '已停用',
      submitted: '提交值：',
      empty: '（无）'
    }
  };

  function mountCheckBoxDemo(fabui) {
    var themeSelect = document.getElementById('checkbox-theme');
    var localeSelect = document.getElementById('checkbox-locale');
    var status = document.getElementById('checkbox-status');
    var controls = [];
    var dynamic;

    function text(key) {
      return (TEXTS[localeSelect.value] || TEXTS.en)[key];
    }

    function log(message) {
      status.textContent = message;
    }

    function create(selector, options) {
      var control = new fabui.CheckBox(selector, options);
      controls.push(control);
      return control;
    }

    function onChange(name) {
      return function(checked) {
        log(name + '：' + (checked ? text('checked') : text('unchecked')));
      };
    }

    if (!fabui || typeof fabui.CheckBox !== 'function') {
      throw new Error('fabui.CheckBox class is unavailable.');
    }

    create('#checkbox-apple', {
      label: 'Apple:',
      value: 'Apple',
      onChange: onChange('Apple')
    });
    create('#checkbox-orange', {
      label: 'Orange:',
      value: 'Orange',
      checked: true,
      onChange: onChange('Orange')
    });
    create('#checkbox-banana', {
      label: 'Banana:',
      value: 'Banana',
      onChange: onChange('Banana')
    });
    create('#checkbox-before', {
      label: 'Before',
      labelPosition: 'before',
      checked: true
    });
    create('#checkbox-after', {
      label: 'After',
      labelPosition: 'after',
      checked: true
    });
    create('#checkbox-top', {
      label: 'Top',
      labelPosition: 'top',
      checked: true
    });
    create('#checkbox-label-right', {
      label: 'Right aligned:',
      labelWidth: 120,
      labelAlign: 'right'
    });
    create('#checkbox-large', {
      label: '32 × 32',
      labelPosition: 'after',
      width: 32,
      height: 32,
      checked: true
    });
    create('#checkbox-disabled', {
      label: 'Disabled',
      labelPosition: 'after',
      checked: true,
      disabled: true
    });
    dynamic = create('#checkbox-dynamic', {
      label: 'Runtime API',
      labelPosition: 'after',
      value: 'runtime',
      onChange: onChange('Runtime API')
    });

    themeSelect.addEventListener('change', function() {
      THEMES.forEach(function(theme) {
        document.body.classList.remove('fg-theme-' + theme);
      });
      document.body.classList.add('fg-theme-' + themeSelect.value);
      controls.forEach(function(control) {
        control.setTheme('inherit');
      });
      log('Theme：' + themeSelect.value);
    });

    localeSelect.addEventListener('change', function() {
      controls.forEach(function(control) {
        control.setLocale(localeSelect.value);
      });
      log(text('ready'));
    });

    document.getElementById('checkbox-toggle').addEventListener('click', function() {
      if (dynamic.isChecked()) dynamic.uncheck();
      else dynamic.check();
    });
    document.getElementById('checkbox-enable').addEventListener('click', function() {
      if (dynamic.options().disabled) {
        dynamic.enable();
        log(text('enabled'));
      } else {
        dynamic.disable();
        log(text('disabled'));
      }
    });
    document.getElementById('checkbox-clear').addEventListener('click', function() {
      dynamic.clear();
    });
    document.getElementById('checkbox-reset').addEventListener('click', function() {
      document.getElementById('checkbox-form').reset();
      log(text('ready'));
    });
    document.getElementById('checkbox-form').addEventListener('submit', function(event) {
      var values;
      event.preventDefault();
      values = Array.from(new FormData(event.currentTarget).values());
      log(text('submitted') + (values.length ? values.join(', ') : text('empty')));
    });

    global.fabCheckBoxDemo = {
      controls: controls,
      dynamic: dynamic
    };
    log(text('ready'));
  }

  global.mountFabUICheckBoxDemo = mountCheckBoxDemo;
}(typeof window !== 'undefined' ? window : this));
