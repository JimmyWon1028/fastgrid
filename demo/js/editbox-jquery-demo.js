(function(global) {
  'use strict';

  function mountFabEditBoxJQueryDemo($) {
    var $boxes = $('.editbox-jquery-input');
    var $output = $('#editbox-jquery-output');

    $('#edit-amount').fabeditbox({
      editor: 'number',
      width: 280,
      precision: 2,
      thousandsSeparator: true,
      prefix: '$'
    });
    $('#edit-date').fabeditbox({
      editor: 'date',
      width: 280,
      locale: 'zh-TW',
      mask: '9999/99/99'
    });
    $('#edit-status').fabeditbox({
      editor: 'combo',
      width: 280,
      editable: true,
      data: [
        { value: 'active', text: '啟用' },
        { value: 'paused', text: '暫停' },
        { value: 'closed', text: '結束' }
      ]
    });
    $('#edit-color').fabeditbox({
      editor: 'color',
      width: 280
    });

    function renderValues() {
      $output.text([
        '姓名：' + $('#edit-name').fabeditbox('getValue'),
        '金額：' + $('#edit-amount').fabeditbox('getValue'),
        '日期：' + $('#edit-date').fabeditbox('getValue'),
        '狀態：' + $('#edit-status').fabeditbox('getValue'),
        '顏色：' + $('#edit-color').fabeditbox('getValue')
      ].join('\n'));
    }

    $boxes.on('change.fabeditbox', renderValues);
    $('#clear-all').on('click', function() {
      $boxes.fabeditbox('clear');
      renderValues();
    });
    $('#reset-all').on('click', function() {
      $boxes.fabeditbox('reset');
      renderValues();
    });
    renderValues();
  }

  global.mountFabEditBoxJQueryDemo = mountFabEditBoxJQueryDemo;
})(typeof globalThis !== 'undefined' ? globalThis : window);
