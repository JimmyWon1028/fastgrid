(function(root, factory) {
  var locale = factory();
  root.fabui = root.fabui || {};
  root.fabui.FabGridLocales = root.fabui.FabGridLocales || {};
  root.fabui.FabGridLocales['zh-CN'] = locale;
  if (root.fabui.FabGrid && root.fabui.FabGrid.addLocale) {
    root.fabui.FabGrid.addLocale('zh-CN', locale);
  }
}(typeof window !== 'undefined' ? window : this, function() {
  return {
    emptyText: '没有数据',
    chart: { emptyText: '没有数据', value: '数值', percent: '百分比' },
    exportBusyText: '正在导出 Excel...',
    workingText: '处理中...',
    loadMsg: '正在处理，请稍候...',
    pagination: {
      ariaLabel: '分页导航',
      pageSize: '每页条数',
      pageNumber: '页码',
      beforePageText: '页',
      afterPageText: '共{pages}页',
      displayMsg: '显示{from}到{to},共{total}记录',
      first: '第一页',
      previous: '上一页',
      next: '下一页',
      last: '最后一页',
      refresh: '刷新'
    },
    validation: {
      invalidValue: '输入值无效',
      invalidDate: '日期格式错误',
      invalidYearMonth: '年月格式错误',
      comboboxLimitToList: '请从列表选择有效项目'
    },
    aria: {
      cellEditor: '单元格编辑器',
      openDatePicker: '打开日期选择器',
      datePicker: '日期选择器',
      openComboBox: '打开下拉菜单',
      comboBoxOptions: '下拉选项',
      openColumnChooser: '打开字段选择器',
      columnChooser: '字段选择器',
      selectAllRows: '选择所有行',
      selectRow: '选择第 {rowNumber} 行',
      year: '年份'
    },
    filter: {
      startsWith: '开头比对({symbol})',
      contains: '包含比对({symbol})',
      endsWith: '结尾比对({symbol})',
      notStartsWith: '隐藏开头比对({symbol})',
      notContains: '不包含比对({symbol})',
      notEndsWith: '隐藏结尾比对({symbol})',
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
      close: '关闭',
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
