(function(root, factory) {
  var locale = factory();
  root.fabui = root.fabui || {};
  root.fabui.FabGridLocales = root.fabui.FabGridLocales || {};
  root.fabui.FabGridLocales['zh-TW'] = locale;
  if (root.fabui.FabGrid && root.fabui.FabGrid.addLocale) {
    root.fabui.FabGrid.addLocale('zh-TW', locale);
  }
}(typeof window !== 'undefined' ? window : this, function() {
  return {
    emptyText: '沒有資料',
    chart: { emptyText: '沒有資料', value: '數值', percent: '百分比' },
    exportBusyText: '匯出 Excel 中...',
    workingText: '處理中...',
    loadMsg: '正在處理，請稍候...',
    pagination: {
      ariaLabel: '分頁導覽',
      pageSize: '每頁筆數',
      pageNumber: '頁碼',
      beforePageText: '頁',
      afterPageText: '共{pages}頁',
      displayMsg: '顯示{from}到{to},共{total}記錄',
      first: '第一頁',
      previous: '上一頁',
      next: '下一頁',
      last: '最後一頁',
      refresh: '重新整理'
    },
    validation: {
      invalidValue: '輸入值無效',
      invalidDate: '日期格式錯誤',
      invalidYearMonth: '年月格式錯誤',
      comboboxLimitToList: '請從清單選擇有效項目'
    },
    aria: {
      cellEditor: '儲存格編輯器',
      openDatePicker: '開啟日期選擇器',
      datePicker: '日期選擇器',
      openComboBox: '開啟下拉選單',
      comboBoxOptions: '下拉選項',
      openColumnChooser: '開啟欄位選擇器',
      columnChooser: '欄位選擇器',
      selectAllRows: '選取所有列',
      selectRow: '選取第 {rowNumber} 列',
      year: '年份'
    },
    filter: {
      startsWith: '開頭比對({symbol})',
      contains: '包含比對({symbol})',
      endsWith: '結尾比對({symbol})',
      notStartsWith: '隱藏開頭比對({symbol})',
      notContains: '不包含比對({symbol})',
      notEndsWith: '隱藏結尾比對({symbol})',
      greaterThanOrEqual: '{symbol}',
      greaterThan: '{symbol}',
      lessThanOrEqual: '{symbol}',
      lessThan: '{symbol}',
      notEqual: '{symbol}',
      equal: '{symbol}',
      clear: '清除'
    },
    datebox: {
      today: '今天',
      close: '關閉',
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      months: [
        '一月',
        '二月',
        '三月',
        '四月',
        '五月',
        '六月',
        '七月',
        '八月',
        '九月',
        '十月',
        '十一月',
        '十二月'
      ],
      monthTitle: '{month} {year}'
    }
  };
}));
