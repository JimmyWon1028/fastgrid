(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function mountButtonDemo(fabui) {
    var theme = document.getElementById('button-theme');
    var status = document.getElementById('button-status');
    var buttons = [];
    var disabledButton;
    var dynamicButton;

    function log(message) {
      status.textContent = message;
    }

    function create(selector, options) {
      var button = new fabui.Button(selector, options);
      buttons.push(button);
      return button;
    }

    function clickMessage(label) {
      return function() {
        log('Click：' + label);
      };
    }

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      buttons.forEach(function(button) {
        button.setTheme('inherit');
      });
    }

    if (!fabui || typeof fabui.Button !== 'function') {
      throw new Error('fabui.Button class is unavailable.');
    }

    create('#button-add', {
      text: '新增',
      iconCls: 'icon-add',
      onClick: clickMessage('新增')
    });
    create('#button-remove', {
      text: '移除',
      iconCls: 'icon-remove',
      onClick: clickMessage('移除')
    });
    create('#button-save', {
      text: '儲存',
      iconCls: 'icon-save',
      onClick: clickMessage('儲存')
    });
    disabledButton = create('#button-cut', {
      text: '剪下',
      iconCls: 'icon-cut',
      disabled: true,
      onClick: clickMessage('剪下')
    });
    create('#button-text', {
      text: '純文字',
      onClick: clickMessage('純文字')
    });

    create('#button-search', {
      text: '搜尋',
      iconCls: 'icon-search',
      width: 92,
      onClick: clickMessage('搜尋')
    });
    create('#button-print', {
      text: '列印',
      iconCls: 'icon-print',
      width: 92,
      onClick: clickMessage('列印')
    });
    create('#button-fluid', {
      text: '50% 寬度',
      iconCls: 'icon-reload',
      width: '50%',
      onClick: clickMessage('Fluid')
    });

    create('#button-plain-add', {
      text: '新增',
      iconCls: 'icon-add',
      plain: true,
      onClick: clickMessage('Plain 新增')
    });
    create('#button-plain-help', {
      iconCls: 'icon-help',
      plain: true,
      onClick: clickMessage('說明')
    });

    create('#button-icon-left', {
      text: 'Left',
      iconCls: 'icon-search',
      iconAlign: 'left',
      onClick: clickMessage('Left')
    });
    create('#button-icon-right', {
      text: 'Right',
      iconCls: 'icon-search',
      iconAlign: 'right',
      onClick: clickMessage('Right')
    });
    create('#button-icon-top', {
      text: 'Top',
      iconCls: 'icon-search',
      iconAlign: 'top',
      size: 'large',
      onClick: clickMessage('Top')
    });
    create('#button-icon-bottom', {
      text: 'Bottom',
      iconCls: 'icon-search',
      iconAlign: 'bottom',
      size: 'large',
      onClick: clickMessage('Bottom')
    });

    create('#button-toggle', {
      text: '獨立 Toggle',
      iconCls: 'icon-check',
      toggle: true,
      onClick: function(sender) {
        log('Toggle：' + (sender.options.selected ? 'selected' : 'unselected'));
      }
    });
    create('#button-group-1', {
      text: '選項一',
      toggle: true,
      group: 'button-demo-group'
    });
    create('#button-group-2', {
      text: '選項二',
      toggle: true,
      group: 'button-demo-group',
      selected: true
    });
    create('#button-group-3', {
      text: '選項三',
      toggle: true,
      group: 'button-demo-group'
    });

    dynamicButton = create('#button-dynamic', {
      text: '動態 Button',
      iconCls: 'icon-edit',
      outline: true,
      onClick: clickMessage('動態 Button')
    });

    theme.addEventListener('change', function() {
      applyTheme(theme.value);
      log('主題：' + theme.value);
    });
    document.getElementById('toggle-disabled').addEventListener('click', function() {
      if (disabledButton.options.disabled) disabledButton.enable();
      else disabledButton.disable();
      log(disabledButton.options.disabled ? '剪下已停用' : '剪下已啟用');
    });
    document.getElementById('change-dynamic').addEventListener('click', function() {
      dynamicButton.setText('已更新').setIcon('icon-reload', 'right');
      dynamicButton.resize({ width: 140, height: 36 });
      log('已呼叫 setText、setIcon、resize');
    });

    applyTheme(theme.value);
    global.fabButtonDemo = {
      buttons: buttons,
      disabledButton: disabledButton,
      dynamicButton: dynamicButton
    };
    log('Button Demo 已就緒');
  }

  global.mountFabUIButtonDemo = mountButtonDemo;
}(typeof window !== 'undefined' ? window : this));
