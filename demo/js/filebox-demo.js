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
      ready: 'FileBox Demo is ready',
      empty: 'No file selected',
      selected: 'Selected: ',
      cleared: 'Selection cleared',
      enabled: 'Enabled',
      disabled: 'Disabled'
    },
    'zh-TW': {
      ready: 'FileBox Demo 已就緒',
      empty: '尚未選擇檔案',
      selected: '已選擇：',
      cleared: '已清除選擇',
      enabled: '已啟用',
      disabled: '已停用'
    },
    'zh-CN': {
      ready: 'FileBox Demo 已就绪',
      empty: '尚未选择文件',
      selected: '已选择：',
      cleared: '已清除选择',
      enabled: '已启用',
      disabled: '已停用'
    }
  };

  function mountFileBoxDemo(fabui) {
    var themeSelect = document.getElementById('filebox-theme');
    var localeSelect = document.getElementById('filebox-locale');
    var status = document.getElementById('filebox-status');
    var controls = [];
    var basic;
    var multiple;
    var dynamic;

    function text(key) {
      return (TEXTS[localeSelect.value] || TEXTS.en)[key];
    }

    function log(message) {
      status.textContent = message;
    }

    function create(selector, options) {
      options.locale = options.locale || localeSelect.value;
      var control = new fabui.FileBox(selector, options);
      controls.push(control);
      return control;
    }

    function onChange(value) {
      log(value ? text('selected') + value : text('empty'));
    }

    if (!fabui || typeof fabui.FileBox !== 'function') {
      throw new Error('fabui.FileBox class is unavailable.');
    }

    basic = create('#filebox-basic', {
      width: '100%',
      label: '檔案：',
      labelPosition: 'top',
      prompt: '請選擇檔案…',
      onChange: onChange
    });
    multiple = create('#filebox-multiple', {
      width: '100%',
      label: '圖片：',
      labelPosition: 'top',
      prompt: '可選擇多張圖片…',
      accept: 'image/*',
      multiple: true,
      separator: '；',
      onChange: onChange
    });
    create('#filebox-left', {
      width: 420,
      label: '左側按鈕：',
      buttonAlign: 'left',
      buttonText: '瀏覽',
      prompt: '按鈕位於左側'
    });
    create('#filebox-disabled', {
      width: 420,
      label: '停用：',
      disabled: true,
      prompt: '無法選擇檔案'
    });
    dynamic = create('#filebox-dynamic', {
      width: 420,
      label: 'Runtime API：',
      prompt: '可清除或切換狀態',
      onChange: onChange
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

    document.getElementById('filebox-clear').addEventListener('click', function() {
      dynamic.clear();
      log(text('cleared'));
    });
    document.getElementById('filebox-toggle').addEventListener('click', function() {
      if (dynamic.options().disabled) {
        dynamic.enable();
        log(text('enabled'));
      } else {
        dynamic.disable();
        log(text('disabled'));
      }
    });
    document.getElementById('filebox-reset').addEventListener('click', function() {
      document.getElementById('filebox-form').reset();
      log(text('cleared'));
    });
    document.getElementById('filebox-form').addEventListener('submit', function(event) {
      var names = [];
      event.preventDefault();
      [basic, multiple].forEach(function(control) {
        Array.prototype.forEach.call(control.files() || [], function(file) {
          names.push(file.name + ' (' + file.size + ' bytes)');
        });
      });
      log(names.length ? text('selected') + names.join(', ') : text('empty'));
    });

    global.fabFileBoxDemo = {
      controls: controls,
      basic: basic,
      multiple: multiple,
      dynamic: dynamic
    };
    log(text('ready'));
  }

  global.mountFabUIFileBoxDemo = mountFileBoxDemo;
}(typeof window !== 'undefined' ? window : this));
