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
      ready: 'CheckGroup Demo is ready',
      selected: 'Selected: ',
      empty: '(none)',
      enabled: 'Enabled',
      disabled: 'Disabled'
    },
    'zh-TW': {
      ready: 'CheckGroup Demo 已就緒',
      selected: '已選擇：',
      empty: '（無）',
      enabled: '已啟用',
      disabled: '已停用'
    },
    'zh-CN': {
      ready: 'CheckGroup Demo 已就绪',
      selected: '已选择：',
      empty: '（无）',
      enabled: '已启用',
      disabled: '已停用'
    }
  };
  var GROUP_DATA = [
    { value: '1', label: 'Item1' },
    { value: '2', label: 'Item2', disabled: true },
    { value: '3', label: 'Item3' },
    { value: '4', label: 'Item4' },
    { value: '5', label: 'Item5' }
  ];

  function mountCheckGroupDemo(fabui) {
    var themeSelect = document.getElementById('checkgroup-theme');
    var localeSelect = document.getElementById('checkgroup-locale');
    var status = document.getElementById('checkgroup-status');
    var controls = [];
    var horizontal;
    var vertical;
    var runtime;

    function text(key) {
      return (TEXTS[localeSelect.value] || TEXTS.en)[key];
    }

    function logValues(values) {
      status.textContent = text('selected') +
        (values.length ? values.join(', ') : text('empty'));
    }

    function create(selector, options) {
      options.locale = options.locale || localeSelect.value;
      var control = new fabui.CheckGroup(selector, options);
      controls.push(control);
      return control;
    }

    if (!fabui || typeof fabui.CheckGroup !== 'function') {
      throw new Error('fabui.CheckGroup class is unavailable.');
    }

    horizontal = create('#checkgroup-horizontal', {
      name: 'horizontal-items',
      value: ['1', '3'],
      data: GROUP_DATA,
      onChange: logValues
    });
    vertical = create('#checkgroup-vertical', {
      name: 'vertical-items',
      value: ['4'],
      data: GROUP_DATA,
      dir: 'v',
      labelWidth: 70,
      onChange: logValues
    });
    runtime = create('#checkgroup-runtime', {
      name: 'runtime-items',
      value: ['1'],
      data: GROUP_DATA.slice(0, 4),
      labelPosition: 'before',
      labelWidth: 58,
      onChange: logValues
    });

    themeSelect.addEventListener('change', function() {
      THEMES.forEach(function(theme) {
        document.body.classList.remove('fg-theme-' + theme);
      });
      document.body.classList.add('fg-theme-' + themeSelect.value);
      controls.forEach(function(control) {
        control.setTheme('inherit');
      });
      status.textContent = 'Theme：' + themeSelect.value;
    });

    localeSelect.addEventListener('change', function() {
      controls.forEach(function(control) {
        control.setLocale(localeSelect.value);
      });
      status.textContent = text('ready');
    });

    document.getElementById('checkgroup-all').addEventListener('click', function() {
      runtime.setValue(['1', '2', '3', '4']);
    });
    document.getElementById('checkgroup-clear').addEventListener('click', function() {
      runtime.clear();
    });
    document.getElementById('checkgroup-reset').addEventListener('click', function() {
      runtime.reset();
    });
    document.getElementById('checkgroup-toggle').addEventListener('click', function() {
      if (runtime.options().disabled) {
        runtime.enable();
        status.textContent = text('enabled');
      } else {
        runtime.disable();
        status.textContent = text('disabled');
      }
    });
    document.getElementById('checkgroup-form').addEventListener('submit', function(event) {
      var data;
      event.preventDefault();
      data = new FormData(event.currentTarget);
      status.textContent = [
        'Horizontal: ' + data.getAll('horizontal-items').join(', '),
        'Vertical: ' + data.getAll('vertical-items').join(', '),
        'Runtime: ' + data.getAll('runtime-items').join(', ')
      ].join(' ｜ ');
    });

    global.fabCheckGroupDemo = {
      controls: controls,
      horizontal: horizontal,
      vertical: vertical,
      runtime: runtime
    };
    status.textContent = text('ready');
  }

  global.mountFabUICheckGroupDemo = mountCheckGroupDemo;
}(typeof window !== 'undefined' ? window : this));
