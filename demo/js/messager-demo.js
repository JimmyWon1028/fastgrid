(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function mountMessagerDemo(fabui) {
    var messager = fabui && fabui.Messager;
    var themeSelect = document.getElementById('messager-theme');
    var localeSelect = document.getElementById('messager-locale');
    var status = document.getElementById('messager-status');
    var progressTimer = null;

    function log(message) {
      status.textContent = message;
    }

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      messager.setTheme('inherit');
    }

    function applyLocale(locale) {
      messager.setLocale(locale);
    }

    function title(zhTw, zhCn, en) {
      if (localeSelect.value === 'zh-TW') return zhTw;
      if (localeSelect.value === 'zh-CN') return zhCn;
      return en;
    }

    function clearProgressTimer() {
      if (progressTimer == null) return;
      clearInterval(progressTimer);
      progressTimer = null;
    }

    if (!messager) throw new Error('fabui.Messager is unavailable.');

    document.getElementById('messager-alert').addEventListener('click', function() {
      messager.alert(
        title('提示', '提示', 'Alert'),
        title('這是一則一般訊息。', '这是一则一般消息。', 'This is a general message.'),
        function() {
          log('Alert：OK');
        }
      );
    });
    ['error', 'info', 'question', 'warning'].forEach(function(icon) {
      document.getElementById('messager-' + icon).addEventListener('click', function() {
        messager.alert({
          title: icon.charAt(0).toUpperCase() + icon.slice(1),
          msg: title(
            '這是一則 ' + icon + ' 訊息。',
            '这是一则 ' + icon + ' 消息。',
            'This is a ' + icon + ' message.'
          ),
          icon: icon,
          fn: function() {
            log(icon + '：OK');
          }
        });
      });
    });
    document.getElementById('messager-confirm').addEventListener('click', function() {
      messager.confirm(
        title('確認', '确认', 'Confirm'),
        title('確定要執行這個動作嗎？', '确定要执行这个操作吗？', 'Do you want to continue?'),
        function(result) {
          log('Confirm：' + result);
        }
      );
    });
    document.getElementById('messager-prompt').addEventListener('click', function() {
      messager.prompt({
        title: title('輸入', '输入', 'Prompt'),
        msg: title('請輸入名稱：', '请输入名称：', 'Enter a name:'),
        value: 'FabUI',
        fn: function(value) {
          log('Prompt：' + (value == null ? 'null' : value));
        }
      });
    });
    document.getElementById('messager-show').addEventListener('click', function() {
      messager.show({
        title: title('訊息', '消息', 'Message'),
        msg: title('四秒後自動關閉。', '四秒后自动关闭。', 'Closes automatically after four seconds.'),
        showType: 'show'
      });
    });
    document.getElementById('messager-slide').addEventListener('click', function() {
      messager.show({
        title: 'Slide',
        msg: title('由右側滑入。', '从右侧滑入。', 'Slides in from the right.'),
        showType: 'slide',
        timeout: 5000
      });
    });
    document.getElementById('messager-fade').addEventListener('click', function() {
      messager.show({
        title: 'Fade',
        msg: title('這則訊息不會自動關閉。', '这则消息不会自动关闭。', 'This message stays open.'),
        showType: 'fade',
        timeout: 0
      });
    });
    document.getElementById('messager-progress').addEventListener('click', function() {
      var value = 0;
      var progressWindow;
      var bar;
      clearProgressTimer();
      progressWindow = messager.progress({
        title: title('請稍候', '请稍候', 'Please wait'),
        msg: title('正在載入資料…', '正在加载数据…', 'Loading data…'),
        value: value,
        interval: 0
      });
      bar = messager.progress('bar');
      progressTimer = setInterval(function() {
        value += 10;
        bar.setValue(value);
        if (value < 100) return;
        clearProgressTimer();
        messager.progress('close');
        log('Progress：100%');
      }, 250);
      global.fabMessagerDemo.progressWindow = progressWindow;
    });
    document.getElementById('messager-close-all').addEventListener('click', function() {
      clearProgressTimer();
      messager.closeAll();
      log('已關閉全部 Messager');
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
    applyLocale(localeSelect.value);
    global.fabMessagerDemo = {
      messager: messager,
      clearProgressTimer: clearProgressTimer,
      progressWindow: null
    };
    log('Messager Demo 已就緒');
  }

  global.mountFabUIMessagerDemo = mountMessagerDemo;
}(typeof window !== 'undefined' ? window : this));
