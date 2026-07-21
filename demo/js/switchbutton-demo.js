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
      ready: 'SwitchButton Demo is ready',
      checked: 'ON',
      unchecked: 'OFF',
      enabled: 'Enabled',
      disabled: 'Disabled',
      readonly: 'Readonly',
      editable: 'Editable',
      submitted: 'Submitted values: ',
      empty: '(none)'
    },
    'zh-TW': {
      ready: 'SwitchButton Demo 已就緒',
      checked: '開啟',
      unchecked: '關閉',
      enabled: '已啟用',
      disabled: '已停用',
      readonly: '唯讀',
      editable: '可切換',
      submitted: '送出值：',
      empty: '（無）'
    },
    'zh-CN': {
      ready: 'SwitchButton Demo 已就绪',
      checked: '开启',
      unchecked: '关闭',
      enabled: '已启用',
      disabled: '已停用',
      readonly: '只读',
      editable: '可切换',
      submitted: '提交值：',
      empty: '（无）'
    }
  };

  function mountSwitchButtonDemo(fabui) {
    var themeSelect = document.getElementById('switchbutton-theme');
    var localeSelect = document.getElementById('switchbutton-locale');
    var status = document.getElementById('switchbutton-status');
    var controls = [];
    var dynamic;

    function text(key) {
      return (TEXTS[localeSelect.value] || TEXTS.en)[key];
    }

    function log(message) {
      status.textContent = message;
    }

    function create(selector, options) {
      var control = new fabui.SwitchButton(selector, options);
      controls.push(control);
      return control;
    }

    function onChange(name) {
      return function(checked) {
        log(name + '：' + (checked ? text('checked') : text('unchecked')));
      };
    }

    if (!fabui || typeof fabui.SwitchButton !== 'function') {
      throw new Error('fabui.SwitchButton class is unavailable.');
    }

    create('#switch-mail', {
      label: 'Receive mail:',
      labelWidth: 120,
      value: 'mail',
      checked: true,
      onChange: onChange('Receive mail')
    });
    create('#switch-network', {
      label: 'Shared network:',
      labelWidth: 120,
      value: 'network',
      checked: true,
      onChange: onChange('Shared network')
    });
    create('#switch-subscribe', {
      label: 'Subscribed:',
      labelWidth: 120,
      value: 'subscribed',
      onChange: onChange('Subscribed')
    });
    create('#switch-custom', {
      label: 'Custom text:',
      labelWidth: 120,
      width: 100,
      onText: '啟用',
      offText: '停用',
      handleText: '◆',
      checked: true
    });
    create('#switch-reversed', {
      label: 'Reversed:',
      labelWidth: 120,
      reversed: true,
      checked: true
    });
    create('#switch-after', {
      label: 'Label after',
      labelPosition: 'after',
      checked: true
    });
    create('#switch-top', {
      label: 'Label top',
      labelPosition: 'top',
      checked: true
    });
    create('#switch-large', {
      label: '100 × 36',
      labelPosition: 'after',
      width: 100,
      height: 36,
      handleWidth: 30,
      checked: true
    });
    create('#switch-disabled', {
      label: 'Disabled',
      labelPosition: 'after',
      checked: true,
      disabled: true
    });
    create('#switch-readonly', {
      label: 'Readonly',
      labelPosition: 'after',
      checked: true,
      readonly: true
    });
    dynamic = create('#switch-dynamic', {
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

    document.getElementById('switchbutton-toggle').addEventListener('click', function() {
      if (dynamic.isChecked()) dynamic.uncheck();
      else dynamic.check();
    });
    document.getElementById('switchbutton-enable').addEventListener('click', function() {
      if (dynamic.options().disabled) {
        dynamic.enable();
        log(text('enabled'));
      } else {
        dynamic.disable();
        log(text('disabled'));
      }
    });
    document.getElementById('switchbutton-readonly-toggle').addEventListener('click', function() {
      var mode = !dynamic.options().readonly;
      dynamic.readonly(mode);
      log(mode ? text('readonly') : text('editable'));
    });
    document.getElementById('switchbutton-reset').addEventListener('click', function() {
      document.getElementById('switchbutton-form').reset();
      log(text('ready'));
    });
    document.getElementById('switchbutton-form').addEventListener('submit', function(event) {
      var values;
      event.preventDefault();
      values = Array.from(new FormData(event.currentTarget).values());
      log(text('submitted') + (values.length ? values.join(', ') : text('empty')));
    });

    global.fabSwitchButtonDemo = {
      controls: controls,
      dynamic: dynamic
    };
    log(text('ready'));
  }

  global.mountFabUISwitchButtonDemo = mountSwitchButtonDemo;
}(typeof window !== 'undefined' ? window : this));
