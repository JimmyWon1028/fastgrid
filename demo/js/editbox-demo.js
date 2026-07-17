(function(global) {
  'use strict';

  function text(value) {
    return value == null || value === '' ? '—' : String(value);
  }

  function mountEditBoxDemo(EditBox) {
    var boxes = {};
    var output = document.getElementById('editbox-output');
    var render;

    if (typeof EditBox !== 'function') {
      throw new Error('EditBox class is unavailable.');
    }

    boxes.name = new EditBox('#edit-name', {
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
    boxes.amount = new EditBox('#edit-amount', {
      editor: 'number',
      width: 280,
      min: 0,
      precision: 2,
      groupSeparator: ',',
      prefix: '$'
    });
    boxes.date = new EditBox('#edit-date', {
      editor: 'date',
      width: 280,
      locale: 'zh-TW',
      mask: '9999/99/99',
      autoUnmask: true
    });
    boxes.month = new EditBox('#edit-month', {
      editor: 'date',
      width: 280,
      locale: 'zh-TW',
      mask: '9999/99',
      autoUnmask: true
    });
    boxes.status = new EditBox('#edit-status', {
      editor: 'combo',
      width: 280,
      editable: true,
      limitToList: true,
      showValueInList: true,
      data: [
        { value: 'active', text: '啟用' },
        { value: 'paused', text: '暫停' },
        { value: 'closed', text: '結束' }
      ]
    });
    boxes.color = new EditBox('#edit-color', {
      editor: 'color',
      width: 280,
      locale: 'zh-TW',
      showAlpha: true
    });

    render = function() {
      output.textContent = [
        '姓名：' + text(boxes.name.getValue()),
        '金額：' + text(boxes.amount.getValue()),
        '日期：' + text(boxes.date.getValue()),
        '年月：' + text(boxes.month.getValue()),
        '狀態：' + text(boxes.status.getValue()),
        '顏色：' + text(boxes.color.getValue())
      ].join('\n');
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

    render();
    global.editBoxDemo = boxes;
    return boxes;
  }

  global.mountFabUIEditBoxDemo = mountEditBoxDemo;
}(typeof window !== 'undefined' ? window : this));
