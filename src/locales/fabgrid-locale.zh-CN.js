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
    combobox: { emptyText: '没有匹配项' },
    exportBusyText: '正在导出 Excel...',
    workingText: '处理中...',
    loadMsg: '正在处理，请稍候...',
    tree: {
      contextMenuAriaLabel: 'TreeGrid 展开与折叠',
      expandAll: '全部展开',
      collapseAll: '全部折叠'
    },
    pivot: {
      grandTotal: '总计',
      total: '小计',
      expandGroup: '展开群组',
      collapseGroup: '折叠群组',
      expandAll: '全部展开',
      collapseAll: '全部折叠',
      showDetail: '查看明细',
      detailTitle: '明细数据',
      detailCount: '共 {count} 条',
      closeDetail: '关闭明细',
      sortAscending: '升序排序',
      sortDescending: '降序排序',
      clearSort: '清除排序',
      aggregate: '汇总方式',
      removeField: '移除字段',
      filteredValues: '已筛选',
      chart: {
        ariaLabel: 'Pivot 图表',
        title: 'Pivot 图表',
        pointsTruncated: '显示前 {count}/{total} 个分类',
        seriesTruncated: '显示前 {count}/{total} 个系列'
      },
      workspace: {
        ariaLabel: 'Pivot 分析工作区',
        panelTitle: '定义 View',
        gridTitle: 'Pivot Grid',
        chartTitle: 'Pivot 图表',
        panelSplitter: '调整定义区大小',
        chartSplitter: '调整图表区大小',
        hidePanel: '隐藏定义',
        showPanel: '显示定义',
        hideChart: '隐藏图表',
        showChart: '显示图表',
        gridFullscreen: 'Pivot Grid 全屏',
        chartFullscreen: 'Pivot 图表全屏',
        exitFullscreen: '退出全屏',
        chartType: '图形类型',
        progress: '汇总中 {progress}%',
        cancel: '取消',
        cancelled: '已取消汇总',
        error: '汇总失败',
        chartTypes: {
          column: '柱形图',
          bar: '条形图',
          line: '折线图',
          pie: '饼图'
        }
      },
      panel: {
        ariaLabel: 'Pivot View 设置',
        fields: '字段',
        filters: '筛选',
        rows: '行',
        columns: '列',
        values: '数值',
        allValues: '全部',
        filterField: '筛选“{field}”',
        aggregateMenu: '数值汇总设置',
        aggregateField: '设置“{field}”汇总函数',
        sortMenu: '维度排序设置',
        sortField: '设置“{field}”排序',
        sortDefault: '默认顺序',
        filterMenu: 'Pivot 字段筛选',
        editFilter: '编辑筛选',
        searchValues: '搜索内容',
        selectAll: '全部选择',
        blankValue: '（空白）',
        apply: '应用',
        cancel: '取消',
        showAs: '值显示方式',
        dropFields: '拖动字段到这里',
        noFields: '没有可用字段',
        removeField: '移除字段'
      },
      aggregates: {
        sum: '求和',
        count: '计数',
        average: '平均',
        weightedaverage: '加权平均',
        min: '最小值',
        max: '最大值'
      },
      showAs: {
        'no-calculation': '不计算',
        'percent-of-grand-total': '总计百分比',
        'percent-of-row-total': '行总计百分比',
        'percent-of-column-total': '列总计百分比',
        'difference-from-previous': '与前一项差异',
        'percent-difference-from-previous': '与前一项差异百分比',
        'running-total': '累计'
      },
      slicer: {
        ariaLabel: 'Pivot 切片器',
        search: '搜索内容',
        selectAll: '全部选择',
        apply: '应用',
        clear: '清除',
        noField: '请选择字段'
      }
    },
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
      invalidTime: '时间格式错误',
      invalidYearMonth: '年月格式错误',
      invalidColor: '色码格式错误',
      comboboxLimitToList: '请从列表选择有效项目'
    },
    topLeftMenu: {
      ariaLabel: 'Grid 菜单',
      useSearchRow: '使用搜索行',
      useExcelFilter: '使用 Excel-like 筛选',
      clearFilter: '清除筛选',
      rowHeaders: '行号',
      rowHeadersOff: '行号：关闭',
      rowHeadersNumbers: '行号：显示行号',
      rowHeadersCellOnly: '行号：仅显示 cell',
      exportExcel: '导出 Excel',
      exportCsv: '导出 CSV',
      fullscreen: 'Grid 全屏',
      exitFullscreen: '退出全屏'
    },
    aria: {
      cellEditor: '单元格编辑器',
      increaseValue: '增加数值',
      decreaseValue: '减少数值',
      openDatePicker: '打开日期选择器',
      datePicker: '日期选择器',
      openComboBox: '打开下拉菜单',
      comboBoxOptions: '下拉选项',
      openColorPicker: '打开颜色选择器',
      colorPicker: '颜色选择器',
      colorSaturation: '饱和度与明度',
      colorHue: '色相',
      colorAlpha: '透明度',
      openColumnChooser: '打开字段选择器',
      columnChooser: '字段选择器',
      selectAllRows: '选择所有行',
      selectRow: '选择第 {rowNumber} 行',
      rowDragItem: 'Grid 数据行',
      expandNode: '展开节点',
      collapseNode: '折叠节点',
      year: '年份'
    },
    filter: {
      openMenu: '打开“{column}”筛选菜单',
      searchValues: '搜索',
      selectAll: '全选',
      apply: '应用',
      cancel: '取消',
      blankValue: '(空白)',
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
      currentMonth: '当月',
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
