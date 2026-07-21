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
    combobox: { emptyText: '沒有符合項目' },
    exportBusyText: '匯出 Excel 中...',
    workingText: '處理中...',
    loadMsg: '正在處理，請稍候...',
    tree: {
      contextMenuAriaLabel: 'TreeGrid 展開與疊合',
      expandAll: '全部展開',
      collapseAll: '全部疊合'
    },
    pivot: {
      grandTotal: '總計',
      total: '小計',
      expandGroup: '展開群組',
      collapseGroup: '收合群組',
      expandAll: '全部展開',
      collapseAll: '全部疊合',
      showDetail: '查看明細',
      detailTitle: '明細資料',
      detailCount: '共 {count} 筆',
      closeDetail: '關閉明細',
      sortAscending: '升冪排序',
      sortDescending: '降冪排序',
      clearSort: '清除排序',
      aggregate: '彙總方式',
      removeField: '移除欄位',
      filteredValues: '已篩選',
      chart: {
        ariaLabel: 'Pivot 圖表',
        title: 'Pivot 圖表',
        pointsTruncated: '顯示前 {count}／{total} 個分類',
        seriesTruncated: '顯示前 {count}／{total} 個系列'
      },
      workspace: {
        ariaLabel: 'Pivot 分析工作區',
        panelTitle: '定義 View',
        gridTitle: 'Pivot Grid',
        chartTitle: 'Pivot 圖表',
        panelSplitter: '調整定義區大小',
        chartSplitter: '調整圖表區大小',
        hidePanel: '隱藏定義',
        showPanel: '顯示定義',
        hideChart: '隱藏圖表',
        showChart: '顯示圖表',
        gridFullscreen: 'Pivot Grid 全螢幕',
        chartFullscreen: 'Pivot 圖表全螢幕',
        exitFullscreen: '離開全螢幕',
        chartType: '圖形類型',
        progress: '彙總中 {progress}%',
        cancel: '取消',
        cancelled: '已取消彙總',
        error: '彙總失敗',
        chartTypes: {
          column: '直條圖',
          bar: '橫條圖',
          line: '折線圖',
          pie: '圓餅圖'
        }
      },
      panel: {
        ariaLabel: 'Pivot View 設定',
        fields: '欄位',
        filters: '篩選',
        rows: '列',
        columns: '欄',
        values: '數值',
        allValues: '全部',
        filterField: '篩選「{field}」',
        aggregateMenu: '數值彙總設定',
        aggregateField: '設定「{field}」彙總函數',
        sortMenu: '維度排序設定',
        sortField: '設定「{field}」排序',
        sortDefault: '預設順序',
        filterMenu: 'Pivot 欄位篩選',
        editFilter: '編輯篩選',
        searchValues: '搜尋內容',
        selectAll: '全部選取',
        blankValue: '（空白）',
        apply: '套用',
        cancel: '取消',
        showAs: '值顯示方式',
        dropFields: '拖曳欄位到這裡',
        noFields: '沒有可用欄位',
        removeField: '移除欄位'
      },
      aggregates: {
        sum: '加總',
        count: '筆數',
        average: '平均',
        weightedaverage: '加權平均',
        min: '最小值',
        max: '最大值'
      },
      showAs: {
        'no-calculation': '不計算',
        'percent-of-grand-total': '總計百分比',
        'percent-of-row-total': '列總計百分比',
        'percent-of-column-total': '欄總計百分比',
        'difference-from-previous': '與前一項差異',
        'percent-difference-from-previous': '與前一項差異百分比',
        'running-total': '累計'
      },
      slicer: {
        ariaLabel: 'Pivot 交叉分析篩選器',
        search: '搜尋內容',
        selectAll: '全部選取',
        apply: '套用',
        clear: '清除',
        noField: '請選擇欄位'
      }
    },
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
      invalidTime: '時間格式錯誤',
      invalidYearMonth: '年月格式錯誤',
      invalidColor: '色碼格式錯誤',
      comboboxLimitToList: '請從清單選擇有效項目'
    },
    topLeftMenu: {
      ariaLabel: 'Grid 功能表',
      showSearchRow: '顯示搜尋列',
      hideSearchRow: '隱藏搜尋列',
      clearFilter: '清除篩選',
      rowHeaders: '列號',
      rowHeadersOff: '列號：關閉',
      rowHeadersNumbers: '列號：顯示列號',
      rowHeadersCellOnly: '列號：只顯示 cell',
      exportExcel: '匯出 Excel',
      exportCsv: '匯出 CSV',
      fullscreen: 'Grid 全螢幕',
      exitFullscreen: '離開全螢幕'
    },
    aria: {
      cellEditor: '儲存格編輯器',
      increaseValue: '增加數值',
      decreaseValue: '減少數值',
      openDatePicker: '開啟日期選擇器',
      datePicker: '日期選擇器',
      openComboBox: '開啟下拉選單',
      comboBoxOptions: '下拉選項',
      openColorPicker: '開啟顏色選擇器',
      colorPicker: '顏色選擇器',
      colorSaturation: '飽和度與明度',
      colorHue: '色相',
      colorAlpha: '透明度',
      openColumnChooser: '開啟欄位選擇器',
      columnChooser: '欄位選擇器',
      selectAllRows: '選取所有列',
      selectRow: '選取第 {rowNumber} 列',
      rowDragItem: 'Grid 資料列',
      expandNode: '展開節點',
      collapseNode: '收合節點',
      year: '年份'
    },
    filter: {
      openMenu: '開啟「{column}」篩選選單',
      searchValues: '搜尋',
      selectAll: '全選',
      apply: '套用',
      cancel: '取消',
      blankValue: '(空白)',
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
      currentMonth: '當月',
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
