(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function mountWindowDemo(fabui, options) {
    var theme = document.getElementById('window-theme');
    var status = document.getElementById('window-status');
    var themeControl;
    var buttonControls = [];
    var basic;
    var modal;
    options = options || {};

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      if (basic) basic.setTheme('inherit');
      if (modal) modal.setTheme('inherit');
      if (themeControl) themeControl.setTheme('inherit');
      buttonControls.forEach(function(control) {
        control.setTheme('inherit');
      });
    }

    function log(message) {
      status.textContent = message;
    }

    if (!fabui || typeof fabui.Window !== 'function') {
      throw new Error('fabui.Window class is unavailable.');
    }
    if (
      options.useFabUIControls &&
      (
        typeof fabui.EditBox !== 'function' ||
        typeof fabui.Button !== 'function'
      )
    ) {
      throw new Error('FabUI Window Demo controls are unavailable.');
    }

    applyTheme(theme.value);
    basic = new fabui.Window('#basic-window', {
      title: '基本 Window',
      iconCls: 'icon-window',
      width: 520,
      height: 330,
      locale: 'zh-TW',
      collapsible: true,
      minimizable: true,
      constrain: true,
      closed: true,
      onMove: function(sender, args) {
        log('移動：' + Math.round(args.left) + ', ' + Math.round(args.top));
      },
      onResize: function(sender, args) {
        log('尺寸：' + Math.round(args.width) + ' × ' + Math.round(args.height));
      }
    });
    modal = new fabui.Window('#modal-window', {
      title: 'Modal Window',
      iconCls: 'icon-window',
      width: 430,
      height: 260,
      locale: 'zh-TW',
      modal: true,
      constrain: true,
      closed: true,
      onOpen: function() {
        log('Modal Window 已開啟');
      },
      onClose: function() {
        log('Modal Window 已關閉');
      }
    });

    if (options.useFabUIControls) {
      themeControl = new fabui.EditBox(theme, {
        editor: 'combo',
        label: '主題',
        labelWidth: 40,
        width: 210,
        editable: false,
        limitToList: true,
        panelHeight: 'auto',
        theme: 'inherit',
        onChange: function(value) {
          applyTheme(value);
          log('主題：' + value);
        }
      });
      [
        'open-basic',
        'open-modal',
        'center-basic',
        'maximize-basic',
        'close-modal'
      ].forEach(function(id) {
        buttonControls.push(new fabui.Button('#' + id, {
          iconCls: '',
          theme: 'inherit'
        }));
      });
    } else {
      theme.addEventListener('change', function() {
        applyTheme(theme.value);
        log('主題：' + theme.value);
      });
    }
    document.getElementById('open-basic').addEventListener('click', function() {
      basic.open().center();
    });
    document.getElementById('open-modal').addEventListener('click', function() {
      modal.open().center();
    });
    document.getElementById('center-basic').addEventListener('click', function() {
      basic.open().center();
    });
    document.getElementById('maximize-basic').addEventListener('click', function() {
      basic.open().maximize();
    });
    document.getElementById('close-modal').addEventListener('click', function() {
      modal.close();
    });

    global.fabWindowDemo = {
      basic: basic,
      modal: modal,
      theme: themeControl,
      buttons: buttonControls
    };
    log('Window Demo 已就緒');
  }

  global.mountFabUIWindowDemo = mountWindowDemo;
}(typeof window !== 'undefined' ? window : this));
