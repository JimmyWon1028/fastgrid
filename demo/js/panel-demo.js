(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black'
  ];

  function mountPanelDemo(fabui) {
    var theme = document.getElementById('panel-theme');
    var status = document.getElementById('panel-status');
    var basic;
    var vertical;

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      if (basic) basic.setTheme('inherit');
      if (vertical) vertical.setTheme('inherit');
    }

    function log(message) {
      status.textContent = message;
    }

    if (!fabui || typeof fabui.Panel !== 'function') {
      throw new Error('fabui.Panel class is unavailable.');
    }

    applyTheme(theme.value);
    basic = new fabui.Panel('#basic-panel', {
      title: '基本 Panel',
      width: '100%',
      height: 300,
      locale: 'zh-TW',
      collapsible: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      footer: 'Panel Footer',
      tools: [{
        iconCls: 'icon-search',
        title: '搜尋',
        ariaLabel: '搜尋',
        onClick: function() {
          log('按下自訂搜尋工具');
        }
      }],
      onCollapse: function() {
        log('基本 Panel 已收合');
      },
      onExpand: function() {
        log('基本 Panel 已展開');
      }
    });
    vertical = new fabui.Panel('#vertical-panel', {
      title: 'Vertical Header',
      width: '100%',
      height: 260,
      locale: 'zh-TW',
      halign: 'left',
      collapsible: true
    });

    theme.addEventListener('change', function() {
      applyTheme(theme.value);
      log('主題：' + theme.value);
    });
    document.getElementById('open-panel').addEventListener('click', function() {
      basic.open();
    });
    document.getElementById('close-panel').addEventListener('click', function() {
      basic.close();
    });
    document.getElementById('toggle-panel').addEventListener('click', function() {
      if (basic.options.collapsed) basic.expand();
      else basic.collapse();
    });
    document.getElementById('restore-panel').addEventListener('click', function() {
      basic.open().restore();
    });

    global.fabPanelDemo = {
      basic: basic,
      vertical: vertical
    };
    log('Panel Demo 已就緒');
  }

  global.mountFabUIPanelDemo = mountPanelDemo;
}(typeof window !== 'undefined' ? window : this));
