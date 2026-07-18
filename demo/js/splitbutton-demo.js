(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black'
  ];

  function mountSplitButtonDemo(fabui) {
    var themeSelect = document.getElementById('splitbutton-theme');
    var status = document.getElementById('splitbutton-status');
    var splitButtons = [];
    var editButton;
    var runtimeButton;

    function log(message) {
      status.textContent = message;
    }

    function create(selector, options) {
      var splitButton = new fabui.SplitButton(selector, options);
      splitButtons.push(splitButton);
      return splitButton;
    }

    function mainAction(label) {
      return function() {
        log(label + '：執行主按鈕動作');
      };
    }

    function menuAction(label) {
      return function(sender, args) {
        log(label + '：' + args.item.text);
      };
    }

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      splitButtons.forEach(function(splitButton) {
        splitButton.setTheme('inherit');
      });
    }

    if (!fabui || typeof fabui.SplitButton !== 'function') {
      throw new Error('fabui.SplitButton class is unavailable.');
    }

    editButton = create('#splitbutton-edit', {
      menu: '#split-menu-edit',
      iconCls: 'icon-edit',
      onClick: mainAction('Edit'),
      onMenuClick: menuAction('Edit 選單')
    });
    create('#splitbutton-save', {
      menu: '#split-menu-save',
      iconCls: 'icon-save',
      onClick: mainAction('Save'),
      onMenuClick: menuAction('Save 選單')
    });
    create('#splitbutton-ok', {
      menu: '#split-menu-ok',
      iconCls: 'icon-ok',
      onClick: mainAction('Ok'),
      onMenuClick: menuAction('Ok 選單')
    });
    create('#splitbutton-right', {
      menu: '#split-menu-right',
      iconCls: 'icon-search',
      menuAlign: 'right',
      onClick: mainAction('Right Align'),
      onMenuClick: menuAction('右對齊選單')
    });
    runtimeButton = create('#splitbutton-runtime', {
      menu: '#split-menu-runtime',
      iconCls: 'icon-reload',
      width: 160,
      onClick: mainAction('Runtime'),
      onShow: function() {
        log('Runtime SplitButton 選單已展開');
      },
      onHide: function() {
        log('Runtime SplitButton 選單已收起');
      },
      onMenuClick: menuAction('Runtime 選單')
    });

    document.getElementById('toggle-splitbutton-disabled').addEventListener('click', function() {
      if (editButton.options().disabled) editButton.enable();
      else editButton.disable();
      log(editButton.options().disabled ? 'Edit 已停用' : 'Edit 已啟用');
    });
    document.getElementById('show-splitbutton').addEventListener('click', function() {
      runtimeButton.show();
    });
    document.getElementById('hide-splitbutton').addEventListener('click', function() {
      runtimeButton.hide();
    });
    document.getElementById('update-splitbutton').addEventListener('click', function() {
      runtimeButton
        .setText('已更新')
        .setIcon('icon-save')
        .resize({ width: 180 });
      log('已呼叫 setText、setIcon、resize');
    });
    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
      log('主題：' + themeSelect.value);
    });

    applyTheme(themeSelect.value);
    global.fabSplitButtonDemo = {
      splitButtons: splitButtons,
      editButton: editButton,
      runtimeButton: runtimeButton
    };
    log('SplitButton Demo 已就緒；主區域執行動作，箭頭區展開選單。');
  }

  global.mountFabUISplitButtonDemo = mountSplitButtonDemo;
}(typeof window !== 'undefined' ? window : this));
