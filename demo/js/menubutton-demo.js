(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black'
  ];

  function mountMenuButtonDemo(fabui) {
    var themeSelect = document.getElementById('menubutton-theme');
    var status = document.getElementById('menubutton-status');
    var menuButtons = [];
    var editButton;
    var actionButton;

    function log(message) {
      status.textContent = message;
    }

    function create(selector, options) {
      var menuButton = new fabui.MenuButton(selector, options);
      menuButtons.push(menuButton);
      return menuButton;
    }

    function menuClick(label) {
      return function(sender, args) {
        log(label + '：' + args.item.text);
      };
    }

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      menuButtons.forEach(function(menuButton) {
        menuButton.setTheme('inherit');
      });
    }

    if (!fabui || typeof fabui.MenuButton !== 'function') {
      throw new Error('fabui.MenuButton class is unavailable.');
    }

    editButton = create('#menubutton-edit', {
      menu: '#menu-edit',
      iconCls: 'icon-edit',
      onMenuClick: menuClick('編輯')
    });
    create('#menubutton-help', {
      menu: '#menu-help',
      iconCls: 'icon-help',
      onMenuClick: menuClick('說明')
    });
    create('#menubutton-about', {
      menu: '#menu-about',
      hasDownArrow: false,
      onMenuClick: menuClick('關於')
    });
    create('#menubutton-left', {
      menu: '#menu-align-left',
      iconCls: 'icon-search',
      menuAlign: 'left',
      onMenuClick: menuClick('左對齊')
    });
    create('#menubutton-right', {
      menu: '#menu-align-right',
      iconCls: 'icon-search',
      menuAlign: 'right',
      onMenuClick: menuClick('右對齊')
    });
    create('#menubutton-click', {
      menu: '#menu-click',
      iconCls: 'icon-save',
      showEvent: 'click',
      hideEvent: 'mouseleave',
      onMenuClick: menuClick('Click')
    });
    actionButton = create('#menubutton-action', {
      menu: '#menu-action',
      iconCls: 'icon-reload',
      width: 150,
      onShow: function() {
        log('Runtime MenuButton 已展開');
      },
      onHide: function() {
        log('Runtime MenuButton 已收起');
      },
      onMenuClick: menuClick('Runtime')
    });

    document.getElementById('toggle-menubutton-disabled').addEventListener('click', function() {
      if (editButton.options().disabled) editButton.enable();
      else editButton.disable();
      log(editButton.options().disabled ? 'Edit 已停用' : 'Edit 已啟用');
    });
    document.getElementById('show-menubutton').addEventListener('click', function() {
      actionButton.show();
    });
    document.getElementById('hide-menubutton').addEventListener('click', function() {
      actionButton.hide();
    });
    document.getElementById('update-menubutton').addEventListener('click', function() {
      actionButton
        .setText('已更新')
        .setIcon('icon-save')
        .resize({ width: 170 });
      log('已呼叫 setText、setIcon、resize');
    });
    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
      log('主題：' + themeSelect.value);
    });

    applyTheme(themeSelect.value);
    global.fabMenuButtonDemo = {
      menuButtons: menuButtons,
      editButton: editButton,
      actionButton: actionButton
    };
    log('MenuButton Demo 已就緒；可停留、點擊或按 ArrowDown 展開。');
  }

  global.mountFabUIMenuButtonDemo = mountMenuButtonDemo;
}(typeof window !== 'undefined' ? window : this));
