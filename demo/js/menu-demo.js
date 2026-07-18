(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black'
  ];

  function mountMenuDemo(fabui) {
    var themeSelect = document.getElementById('menu-theme');
    var localeSelect = document.getElementById('menu-locale');
    var contextArea = document.getElementById('menu-context-area');
    var status = document.getElementById('menu-status');
    var menus = [];
    var basicMenu;
    var inlineMenu;
    var dynamicMenu;
    var runtimeCounter = 1;

    function log(message) {
      status.textContent = message;
    }

    function itemText(item) {
      return item && item.text ? item.text : 'separator';
    }

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      menus.forEach(function(menu) {
        menu.setTheme('inherit');
      });
    }

    function applyLocale(locale) {
      menus.forEach(function(menu) {
        menu.setLocale(locale);
      });
    }

    if (!fabui || typeof fabui.Menu !== 'function') {
      throw new Error('fabui.Menu class is unavailable.');
    }

    basicMenu = new fabui.Menu('#menu-basic', {
      locale: localeSelect.value,
      hideOnUnhover: false,
      onClick: function(item) {
        log('Basic Menu：' + itemText(item));
      },
      onShow: function() {
        contextArea.classList.add('menu-context-active');
      },
      onHide: function() {
        contextArea.classList.remove('menu-context-active');
      }
    });
    menus.push(basicMenu);
    basicMenu.findItem({ name: 'new' }).onclick = function() {
      log('已執行新增');
    };

    inlineMenu = new fabui.Menu('#menu-inline', {
      locale: localeSelect.value,
      onClick: function(item) {
        log('Inline Menu：' + itemText(item));
      }
    });
    menus.push(inlineMenu);

    dynamicMenu = new fabui.Menu('#menu-dynamic', {
      locale: localeSelect.value,
      minWidth: 180,
      hideOnUnhover: false,
      items: [
        { name: 'refresh', text: '重新整理', iconCls: 'icon-reload' },
        {
          name: 'export',
          text: '匯出',
          iconCls: 'icon-export',
          children: [
            { name: 'excel', text: 'Excel', iconCls: 'icon-excel' },
            { name: 'print', text: '列印', iconCls: 'icon-print' }
          ]
        },
        { separator: true },
        { name: 'disabled', text: '停用項目', disabled: true }
      ],
      onClick: function(item) {
        log('Runtime Menu：' + itemText(item));
      }
    });
    menus.push(dynamicMenu);

    contextArea.addEventListener('contextmenu', function(event) {
      event.preventDefault();
      basicMenu.show({
        left: event.pageX,
        top: event.pageY
      });
    });

    document.getElementById('show-basic-menu').addEventListener('click', function(event) {
      var rect = event.currentTarget.getBoundingClientRect();
      basicMenu.show({
        left: rect.left + window.pageXOffset,
        top: rect.bottom + window.pageYOffset + 4
      });
    });

    document.getElementById('show-dynamic-menu').addEventListener('click', function(event) {
      var rect = event.currentTarget.getBoundingClientRect();
      dynamicMenu.show({
        left: rect.left + window.pageXOffset,
        top: rect.bottom + window.pageYOffset + 4
      });
    });

    document.getElementById('append-menu-item').addEventListener('click', function() {
      var item = dynamicMenu.appendItem({
        name: 'runtime-' + runtimeCounter,
        text: '動態項目 ' + runtimeCounter,
        iconCls: 'icon-add'
      });
      runtimeCounter += 1;
      log('已 appendItem：' + item.text);
    });

    document.getElementById('toggle-menu-disabled').addEventListener('click', function() {
      var item = dynamicMenu.findItem({ name: 'disabled' });
      if (item.disabled) {
        dynamicMenu.enableItem(item.target);
        log('停用項目已啟用');
      } else {
        dynamicMenu.disableItem(item.target);
        log('項目已停用');
      }
    });

    document.getElementById('rename-menu-item').addEventListener('click', function() {
      var item = dynamicMenu.findItem({ name: 'refresh' });
      dynamicMenu.setText({
        target: item.target,
        text: item.text === '重新整理' ? '重新載入資料' : '重新整理'
      });
      dynamicMenu.setIcon({
        target: item.target,
        iconCls: item.iconCls === 'icon-reload' ? 'icon-search' : 'icon-reload'
      });
      log('已呼叫 setText／setIcon');
    });

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
      log('主題：' + themeSelect.value);
    });
    localeSelect.addEventListener('change', function() {
      applyLocale(localeSelect.value);
      log('語系：' + localeSelect.value);
    });

    applyTheme(themeSelect.value);
    global.fabMenuDemo = {
      basicMenu: basicMenu,
      inlineMenu: inlineMenu,
      dynamicMenu: dynamicMenu
    };
    log('Menu Demo 已就緒；可在藍色區域按滑鼠右鍵。');
  }

  global.mountFabUIMenuDemo = mountMenuDemo;
}(typeof window !== 'undefined' ? window : this));
