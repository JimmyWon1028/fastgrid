(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black'
  ];

  function mountTooltipDemo(fabui) {
    var themeSelect = document.getElementById('tooltip-theme');
    var status = document.getElementById('tooltip-status');
    var controls = [];
    var updateIndex = 0;
    var manualTooltip;

    function log(message) {
      status.textContent = message;
    }

    function create(selector, options) {
      var tooltip = new fabui.Tooltip(selector, options);
      controls.push(tooltip);
      return tooltip;
    }

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      controls.forEach(function(tooltip) {
        tooltip.setTheme('inherit');
      });
      log('主題：' + value);
    }

    if (!fabui || typeof fabui.Tooltip !== 'function') {
      throw new Error('fabui.Tooltip class is unavailable.');
    }

    create('#tooltip-basic', {
      showEvent: 'mouseenter focus',
      hideEvent: 'mouseleave blur',
      onShow: function() {
        log('顯示：基本 Tooltip');
      }
    });
    ['top', 'bottom', 'left', 'right'].forEach(function(position) {
      create('#tooltip-' + position, {
        position: position,
        content: position.charAt(0).toUpperCase() + position.slice(1) + ' Tooltip',
        showEvent: 'mouseenter focus',
        hideEvent: 'mouseleave blur',
        showDelay: 80
      });
    });
    create('#tooltip-html', {
      position: 'right',
      showEvent: 'mouseenter focus',
      hideEvent: 'mouseleave blur',
      content: function() {
        return '<strong>HTML 內容</strong><br><span>由 content function 動態產生。</span>';
      },
      onPosition: function(left, top) {
        log('HTML Tooltip 位置：' + left + ', ' + top);
      }
    });
    create('#tooltip-track', {
      content: 'Tooltip 會跟隨滑鼠位置',
      trackMouse: true,
      showEvent: 'mouseenter click',
      showDelay: 40,
      hideDelay: 40
    });
    create('#tooltip-click', {
      position: 'bottom',
      content: '再次點擊目標不會誤關閉；按 Escape 或點擊外部可關閉。',
      showEvent: 'click',
      hideEvent: '',
      showDelay: 0,
      hideDelay: 0
    });
    manualTooltip = create('#tooltip-manual-host', {
      position: 'top',
      content: '手動控制內容 0',
      showEvent: '',
      hideEvent: '',
      showDelay: 0,
      hideDelay: 0,
      onUpdate: function(content) {
        log('更新：' + content);
      }
    });

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
    });
    document.getElementById('tooltip-show').addEventListener('click', function() {
      manualTooltip.show();
      log('手動顯示 Tooltip');
    });
    document.getElementById('tooltip-update').addEventListener('click', function() {
      updateIndex += 1;
      manualTooltip.update('手動控制內容 ' + updateIndex);
    });
    document.getElementById('tooltip-hide').addEventListener('click', function() {
      manualTooltip.hide();
      log('手動隱藏 Tooltip');
    });

    applyTheme(themeSelect.value);
    global.fabTooltipDemo = {
      controls: controls,
      manualTooltip: manualTooltip
    };
    log('Tooltip Demo 已就緒');
  }

  global.mountFabUITooltipDemo = mountTooltipDemo;
}(typeof window !== 'undefined' ? window : this));
