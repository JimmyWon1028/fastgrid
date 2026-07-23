(function(global) {
  'use strict';

  function text(value) {
    return value == null || value === '' ? '—' : String(value);
  }

  function mountEditBoxDemo(fabui) {
    var boxes = {};
    var output = document.getElementById('editbox-output');
    var themeSelect = document.getElementById('calendar-theme');
    var render;

    function applyTheme(theme) {
      Array.prototype.forEach.call(themeSelect.options, function(option) {
        document.body.classList.remove('fg-theme-' + option.value);
      });
      document.body.classList.add('fg-theme-' + theme);
    }

    if (!fabui || typeof fabui.EditBox !== 'function') {
      throw new Error('fabui.EditBox class is unavailable.');
    }

    applyTheme(themeSelect.value);

    boxes.name = new fabui.EditBox('#edit-name', {
      editor: 'text',
      width: 280,
      prompt: '請輸入姓名',
      icons: [{
        iconCls: 'icon-refwin',
        title: '選擇參照',
        ariaLabel: '選擇參照',
        width: 28,
        onClick: function() {
          this.setValue('參照-001');
        }
      }],
      clearButton: true
    });
    if (document.getElementById('edit-two-buttons')) {
      boxes.twoButtons = new fabui.EditBox('#edit-two-buttons', {
        editor: 'text',
        width: 280,
        icons: [{
          iconCls: 'icon-search',
          title: '搜尋',
          ariaLabel: '搜尋',
          width: 28,
          onClick: function() {
            this.setValue('搜尋結果');
          }
        }, {
          iconCls: 'icon-clear',
          title: '清除',
          ariaLabel: '清除',
          width: 28,
          onClick: function() {
            this.clear();
          }
        }]
      });
      boxes.leftButton = new fabui.EditBox('#edit-left-button', {
        editor: 'text',
        width: 280,
        icons: [{
          iconCls: 'icon-refwin',
          title: '選擇左側參照',
          ariaLabel: '選擇左側參照',
          width: 28,
          align: 'left',
          onClick: function() {
            this.setValue('左側參照-001');
          }
        }]
      });
    }
    boxes.amount = new fabui.EditBox('#edit-amount', {
      editor: 'number',
      width: 280,
      min: 0,
      precision: 2,
      groupSeparator: ',',
      prefix: '$'
    });
    if (document.getElementById('edit-spinner-true')) {
      boxes.spinnerTrue = new fabui.EditBox('#edit-spinner-true', {
        editor: 'number',
        width: 280,
        spinner: true
      });
      boxes.spinnerRight = new fabui.EditBox('#edit-spinner-right', {
        editor: 'number',
        width: 280,
        spinner: 'right'
      });
      boxes.spinnerLeft = new fabui.EditBox('#edit-spinner-left', {
        editor: 'number',
        width: 280,
        spinner: 'left'
      });
    }
    boxes.date = new fabui.EditBox('#edit-date', {
      editor: 'date',
      width: 280,
      locale: 'zh-TW',
      mask: '9999/99/99',
      autoUnmask: true
    });
    boxes.month = new fabui.EditBox('#edit-month', {
      editor: 'date',
      width: 280,
      locale: 'zh-TW',
      mask: '9999/99',
      autoUnmask: true
    });
    if (document.getElementById('edit-time')) {
      boxes.time = new fabui.EditBox('#edit-time', {
        editor: 'time',
        width: 280,
        locale: 'zh-TW'
      });
      boxes.timeSeconds = new fabui.EditBox('#edit-time-seconds', {
        editor: 'time',
        width: 280,
        locale: 'zh-TW',
        mask: '99:99:99',
        spinner: true
      });
    }
    boxes.status = new fabui.EditBox('#edit-status', {
      editor: 'combo',
      width: 280,
      locale: 'zh-TW',
      editable: true,
      limitToList: true,
      showValueInList: true,
      data: [
        { value: 'active', text: '啟用' },
        { value: 'paused', text: '暫停' },
        { value: 'closed', text: '結束' }
      ]
    });
    boxes.color = new fabui.EditBox('#edit-color', {
      editor: 'color',
      width: 280,
      locale: 'zh-TW',
      showAlpha: true
    });

    render = function() {
      var lines = [
        '元件主題：' + themeSelect.value,
        '姓名：' + text(boxes.name.getValue()),
        '金額：' + text(boxes.amount.getValue())
      ];
      if (boxes.twoButtons) {
        lines.splice(
          2,
          0,
          '兩個自訂按鈕：' + text(boxes.twoButtons.getValue()),
          '左側自訂按鈕：' + text(boxes.leftButton.getValue())
        );
      }
      if (boxes.spinnerTrue) {
        lines.push(
          'Spinner true：' + text(boxes.spinnerTrue.getValue()),
          'Spinner right：' + text(boxes.spinnerRight.getValue()),
          'Spinner left：' + text(boxes.spinnerLeft.getValue())
        );
      }
      lines = lines.concat([
        '日期：' + text(boxes.date.getValue()),
        '年月：' + text(boxes.month.getValue())
      ]);
      if (boxes.time) {
        lines.push(
          '時間：' + text(boxes.time.getValue()),
          '時間（含秒）：' + text(boxes.timeSeconds.getValue())
        );
      }
      lines = lines.concat([
        '狀態：' + text(boxes.status.getValue()),
        '顏色：' + text(boxes.color.getValue())
      ]);
      output.textContent = lines.join('\n');
    };

    Object.keys(boxes).forEach(function(name) {
      boxes[name].on('change', render);
    });

    document.getElementById('clear-all').addEventListener('click', function() {
      Object.keys(boxes).forEach(function(name) {
        boxes[name].clear();
      });
      render();
    });

    document.getElementById('reset-all').addEventListener('click', function() {
      Object.keys(boxes).forEach(function(name) {
        boxes[name].reset();
      });
      render();
    });

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
      render();
    });

    render();
    global.editBoxDemo = boxes;
    return boxes;
  }

  global.mountFabUIEditBoxDemo = mountEditBoxDemo;
}(typeof window !== 'undefined' ? window : this));
