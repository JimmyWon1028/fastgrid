(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function mountTabsDemo(fabui) {
    var themeSelect = document.getElementById('tabs-theme');
    var localeSelect = document.getElementById('tabs-locale');
    var positionSelect = document.getElementById('tabs-position');
    var styleSelect = document.getElementById('tabs-style');
    var dragToggle = document.getElementById('tabs-draggable');
    var status = document.getElementById('tabs-status');
    var dynamicIndex = 0;
    var mainTabs;
    var overflowTabs;

    function log(message) {
      status.textContent = message;
    }

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      mainTabs.setTheme('inherit');
      overflowTabs.setTheme('inherit');
      log('主題：' + value);
    }

    if (!fabui || typeof fabui.Tabs !== 'function') {
      throw new Error('fabui.Tabs class is unavailable.');
    }

    mainTabs = new fabui.Tabs('#tabs-main', {
      width: '100%',
      height: 310,
      locale: localeSelect.value,
      draggable: dragToggle ? dragToggle.checked : false,
      // draggable: false,
      tools: [{
        iconCls: 'icon-add',
        title: '新增頁籤',
        handler: function() {
          document.getElementById('tabs-add').click();
        }
      }, {
        iconCls: 'icon-remove',
        title: '關閉頁籤',
        handler: function() {
          document.getElementById('tabs-close').click();
        }
      }],
      onSelect: function(title, index) {
        log('選取：' + title + '（' + index + '）');
      },
      onBeforeClose: function(title) {
        log('準備關閉：' + title);
        return title !== '首頁';
      },
      onClose: function(title) {
        log('已關閉：' + title);
      },
      onContextMenu: function(event, title, index) {
        event.preventDefault();
        log('右鍵頁籤：' + title + '（' + index + '）');
      },
      onReorder: function(title, fromIndex, toIndex) {
        log('移動頁籤：' + title + '（' + fromIndex + ' → ' + toIndex + '）');
      }
    });

    overflowTabs = new fabui.Tabs('#tabs-overflow', {
      width: 430,
      height: 150,
      locale: localeSelect.value,
      tabWidth: 120,
      scrollIncrement: 120,
      draggable: dragToggle ? dragToggle.checked : false,
      tabs: [
        { title: '客戶資料', content: '<div class="tab-content">客戶資料</div>', selected: false },
        { title: '訂單管理', content: '<div class="tab-content">訂單管理</div>', selected: false },
        { title: '庫存查詢', content: '<div class="tab-content">庫存查詢</div>', selected: false },
        { title: '銷售報表', content: '<div class="tab-content">銷售報表</div>', selected: false },
        { title: '系統設定', content: '<div class="tab-content">系統設定</div>', selected: false }
      ]
    });

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
    });
    localeSelect.addEventListener('change', function() {
      mainTabs.setLocale(localeSelect.value);
      overflowTabs.setLocale(localeSelect.value);
      log('語系：' + localeSelect.value);
    });
    positionSelect.addEventListener('change', function() {
      mainTabs.setOptions({ tabPosition: positionSelect.value });
      log('頁籤位置：' + positionSelect.value);
    });
    styleSelect.addEventListener('change', function() {
      mainTabs.setOptions({
        plain: styleSelect.value === 'plain',
        narrow: styleSelect.value === 'narrow',
        pill: styleSelect.value === 'pill',
        justified: styleSelect.value === 'justified'
      });
      log('頁籤樣式：' + styleSelect.value);
    });
    if (dragToggle) {
      dragToggle.addEventListener('change', function() {
        mainTabs.setOptions({ draggable: dragToggle.checked });
        overflowTabs.setOptions({ draggable: dragToggle.checked });
        log(dragToggle.checked ? '已開啟頁籤拖曳排序' : '已關閉頁籤拖曳排序');
      });
    }
    document.getElementById('tabs-add').addEventListener('click', function() {
      dynamicIndex += 1;
      mainTabs.add({
        title: '動態頁籤 ' + dynamicIndex,
        content: '<div class="tab-content">動態內容 ' + dynamicIndex + '</div>',
        iconCls: 'icon-add',
        closable: true,
        tools: [{
          iconCls: 'icon-reload',
          title: '重新整理',
          handler: function() {
            log('動態頁籤工具：重新整理');
          }
        }]
      });
    });
    document.getElementById('tabs-close').addEventListener('click', function() {
      var selected = mainTabs.getSelected();
      if (selected) mainTabs.close(selected);
    });
    document.getElementById('tabs-toggle-disabled').addEventListener('click', function() {
      var tab = mainTabs.getTab('報表');
      var index = mainTabs.getTabIndex(tab);
      if (index < 0) return;
      if (mainTabs.getTabOptions(index).disabled) {
        mainTabs.enableTab(index);
        log('報表頁籤已啟用');
      } else {
        mainTabs.disableTab(index);
        log('報表頁籤已停用');
      }
    });
    document.getElementById('tabs-toggle-header').addEventListener('click', function() {
      if (mainTabs.options().showHeader) mainTabs.hideHeader();
      else mainTabs.showHeader();
    });

    applyTheme(themeSelect.value);
    global.fabTabsDemo = {
      mainTabs: mainTabs,
      overflowTabs: overflowTabs
    };
    log('Tabs Demo 已就緒');
  }

  global.mountFabUITabsDemo = mountTabsDemo;
}(typeof window !== 'undefined' ? window : this));
