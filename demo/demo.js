(function() {
  'use strict';

  var DEMO_ROW_COUNT = 2000;
  var DEMO_COLUMN_COUNT = 20;
  var DEMO_ROW_HEADER_WIDTH = 50;
  var DEMO_SETTINGS_KEY = 'fastgrid.demo.settings.v3.rowGroupMode';
  var DEMO_LEGACY_SETTINGS_KEY = 'fastgrid.demo.settings.v2.rowGroups';
  var DEFAULT_DEMO_SETTINGS = {
    locale: 'zh-TW',
    theme: 'default',
    searchText: '',
    frozenColumns: 0,
    frozenRightColumns: 0,
    showRowHeaders: false,
    showSearchRow: true,
    rowGroupMode: 'order',
    multiSelectRows: false,
    editMode: true
  };
  var DEMO_LOCALES = {
    en: {
      search: 'Search',
      searchPlaceholder: 'Keyword',
      language: 'Language',
      theme: 'Theme',
      frozen: 'Frozen',
      frozenRight: 'Right frozen',
      rowHeaders: 'Row no.',
      searchRow: 'Search row',
      groupRows: 'Group',
      groupNone: 'No group',
      groupOrder: 'Order No.',
      groupVendor: 'Vendor + Order No.',
      groupVendorOrder: 'Vendor > Order No.',
      groupHeader: '{header}: {key} ({count} items)',
      groupVendorOrderHeader: '{header}: {vendor} + {order} ({count} items)',
      multiSelect: 'Multi select',
      editMode: 'Edit',
      exportCsv: 'Export CSV',
      exportExcel: 'Export Excel',
      rows: 'Rows',
      rowsVisible: 'Rows visible',
      columnsVisible: 'Columns visible',
      renderedCells: 'Rendered cells',
      columnHeaders: {
        id: 'Vendor',
        name: 'Short Name',
        region: 'Area',
        status: 'Currency',
        category: 'Item',
        refCode: 'Order No.',
        popupCode: 'Description',
        amount: 'Payable',
        score: 'Score (async)',
        textDate: 'Text date',
        date: 'Date',
        defaultColumn: 'Column {index}'
      }
    },
    'zh-TW': {
      search: '搜尋',
      searchPlaceholder: '輸入關鍵字',
      language: '語言',
      theme: '主題',
      frozen: '凍結欄',
      frozenRight: '右凍結欄',
      rowHeaders: '列號',
      searchRow: '搜尋列',
      groupRows: '群組',
      groupNone: '沒有群組',
      groupOrder: '訂單編號',
      groupVendor: '主要廠商 + 訂單編號',
      groupVendorOrder: '主要廠商 > 訂單編號',
      groupHeader: '{header}: {key} ({count} 項目)',
      groupVendorOrderHeader: '{header}: {vendor} + {order} ({count} 項目)',
      multiSelect: '多選',
      editMode: '編輯',
      exportCsv: '匯出 CSV',
      exportExcel: '匯出 Excel',
      rows: '列數',
      rowsVisible: '可視列',
      columnsVisible: '可視欄',
      renderedCells: '已渲染儲存格',
      columnHeaders: {
        id: '主要廠商',
        name: '簡稱',
        region: '地區',
        status: '幣別',
        category: '項目',
        refCode: '訂單編號',
        popupCode: '敘述',
        amount: '應付金額',
        score: '分數(非同步)',
        textDate: '文字日期',
        date: '日期',
        defaultColumn: '欄位 {index}'
      }
    }
  };
  var DEMO_THEMES = [
    { value: 'default', label: 'Default' },
    { value: 'bootstrap', label: 'Bootstrap' },
    { value: 'cupertino', label: 'Cupertino' },
    { value: 'material', label: 'Material' },
    { value: 'material-blue', label: 'Material Blue' },
    { value: 'material-teal', label: 'Material Teal' },
    { value: 'metro', label: 'Metro' },
    { value: 'metro-blue', label: 'Metro Blue' },
    { value: 'metro-gray', label: 'Metro Gray' },
    { value: 'metro-green', label: 'Metro Green' },
    { value: 'metro-orange', label: 'Metro Orange' },
    { value: 'metro-red', label: 'Metro Red' },
    { value: 'sunny', label: 'Sunny' },
    { value: 'pepper-grinder', label: 'Pepper Grinder' },
    { value: 'dark-hive', label: 'Dark Hive' },
    { value: 'black', label: 'Black' }
  ];
  var DEMO_ROW_GROUPS = {
    order: [
      {
        binding: 'refCode',
        header: formatDemoRowGroupHeader
      }
    ],
    vendor: [
      {
        binding: ['id', 'refCode'],
        header: formatDemoVendorOrderRowGroupHeader
      }
    ],
    'vendor-order': [
      {
        binding: 'id',
        header: formatDemoRowGroupHeader
      },
      {
        binding: 'refCode',
        header: formatDemoRowGroupHeader
      }
    ]
  };
  var rows = createRows(DEMO_ROW_COUNT, DEMO_COLUMN_COUNT);
  var columns = createColumns(DEMO_COLUMN_COUNT);
  var stats = {
    datasetSummary: document.getElementById('datasetSummary'),
    rowCount: document.getElementById('rowCount'),
    rowRange: document.getElementById('rowRange'),
    columnRange: document.getElementById('columnRange'),
    cellCount: document.getElementById('cellCount')
  };
  var controls = {
    search: document.getElementById('searchInput'),
    language: document.getElementById('languageInput'),
    theme: document.getElementById('themeInput'),
    frozen: document.getElementById('frozenInput'),
    frozenRight: document.getElementById('frozenRightInput'),
    rowHeaders: document.getElementById('rowHeadersInput'),
    searchRow: document.getElementById('searchRowInput'),
    groupRows: document.getElementById('groupRowsInput'),
    multiSelect: document.getElementById('multiSelectInput'),
    editMode: document.getElementById('editModeInput')
  };
  var labels = {
    search: document.getElementById('searchLabel'),
    language: document.getElementById('languageLabel'),
    theme: document.getElementById('themeLabel'),
    frozen: document.getElementById('frozenLabel'),
    frozenRight: document.getElementById('frozenRightLabel'),
    rowHeaders: document.getElementById('rowHeadersLabel'),
    searchRow: document.getElementById('searchRowLabel'),
    groupRows: document.getElementById('groupRowsLabel'),
    multiSelect: document.getElementById('multiSelectLabel'),
    editMode: document.getElementById('editModeLabel'),
    exportCsv: document.getElementById('exportButton'),
    exportExcel: document.getElementById('exportExcelButton')
  };
  var toolbarControls = document.querySelectorAll('.toolbar input, .toolbar select, .toolbar button');
  var lookupPopup = null;
  var lookupGrid = null;
  var lookupEditorArgs = null;
  var lookupLastClick = null;

  loadDemoThemeStyles();
  populateThemeOptions();

  var demoSettings = loadDemoSettings();

  applyDemoSettingsToControls(demoSettings);
  applyDemoLocale(demoSettings.locale);
  applyColumnHeaderLocale(columns, demoSettings.locale);

  var grid = new FastGrid('#grid', {
    rowHeight: 32,
    headerHeight: 32,
    searchDelay: 200,
    overscanRows: 14,
    overscanColumns: 3,
    frozenColumns: demoSettings.frozenColumns,
    frozenRightColumns: demoSettings.frozenRightColumns,
    locale: demoSettings.locale,
    showRowHeaders: demoSettings.showRowHeaders,
    rowHeaderWidth: DEMO_ROW_HEADER_WIDTH,
    observeItemsSource: true,
    showSearchRow: demoSettings.showSearchRow,
    showFooter: true,
    footerHeight: 32,
    multiSelectRows: demoSettings.multiSelectRows,
    itemsSource: rows,
    columns: columns,
    rowGroups: getDemoRowGroups(demoSettings.rowGroupMode),
    allowSorting: true,
    allowDragging: 'Columns',
    allowEditing: demoSettings.editMode,
    editOnSelect: demoSettings.editMode,
    allowResizing: true,
    alternatingRows: true,
    alternatingRowBackground: '#fafafa',
    headerToggleKey: 'F4', //'Ctrl+F4'
    formatCell: function(args) {
      if (args.column.binding === 'status') {
        if (args.value === 'Active' || args.value === '啟用') {
          args.cell.className += ' status-active';
          args.cell.style.color = '#047857';
        } else {
          args.cell.className += ' status-paused';
          args.cell.style.color = '#9a3412';
        }
        args.cell.style.fontWeight = '600';
      }
    }
  });
  applyDemoTheme(demoSettings.theme);
  if (demoSettings.searchText) {
    grid.setSearch(demoSettings.searchText);
  }

  updateDatasetSummary();
  updateViewportStats({
    totalRows: grid.view.length,
    rowStart: grid.rowRange.start,
    rowEnd: grid.rowRange.end,
    columnStart: grid.columnRange.start,
    columnEnd: grid.columnRange.end,
    renderedCells: grid.root.querySelectorAll('.fg-cell').length
  });

  grid.on('viewportChanged', updateViewportStats);

  grid.on('searchCleared', function() {
    controls.search.value = '';
    saveCurrentDemoSettings();
  });

  grid.on('excelExporting', function() {
    setToolbarBusy(true);
  });

  grid.on('excelExported', function() {
    setToolbarBusy(false);
  });

  grid.on('excelExportFailed', function() {
    setToolbarBusy(false);
  });

  controls.search.addEventListener('input', function(event) {
    grid.setSearch(event.target.value);
    saveCurrentDemoSettings();
  });

  controls.language.addEventListener('change', function(event) {
    var locale = normalizeLocaleSetting(event.target.value, DEFAULT_DEMO_SETTINGS.locale);
    grid.setLocale(locale);
    applyDemoLocale(locale);
    applyGridColumnHeaderLocale(grid, locale);
    refreshDemoRowGroups();
    saveCurrentDemoSettings();
    updateViewportStats({
      totalRows: grid.view.length,
      rowStart: grid.rowRange.start,
      rowEnd: grid.rowRange.end,
      columnStart: grid.columnRange.start,
      columnEnd: grid.columnRange.end,
      renderedCells: grid.root.querySelectorAll('.fg-cell').length
    });
  });

  controls.theme.addEventListener('change', function(event) {
    applyDemoTheme(event.target.value);
    saveCurrentDemoSettings();
  });

  controls.frozen.addEventListener('input', function(event) {
    grid.setFrozenColumns(Number(event.target.value || 0));
    saveCurrentDemoSettings();
  });

  controls.frozenRight.addEventListener('input', function(event) {
    grid.setFrozenRightColumns(Number(event.target.value || 0));
    saveCurrentDemoSettings();
  });

  controls.rowHeaders.addEventListener('change', function(event) {
    grid.setShowRowHeaders(normalizeRowHeaderSetting(event.target.value, DEFAULT_DEMO_SETTINGS.showRowHeaders));
    saveCurrentDemoSettings();
  });

  controls.searchRow.addEventListener('change', function(event) {
    if (grid.setShowSearchRow) {
      grid.setShowSearchRow(event.target.checked);
    }
    saveCurrentDemoSettings();
  });

  if (controls.groupRows) {
    controls.groupRows.addEventListener('change', function(event) {
      grid.setRowGroups(getDemoRowGroups(event.target.value));
      saveCurrentDemoSettings();
      updateViewportStats({
        totalRows: grid.view.length,
        rowStart: grid.rowRange.start,
        rowEnd: grid.rowRange.end,
        columnStart: grid.columnRange.start,
        columnEnd: grid.columnRange.end,
        renderedCells: grid.root.querySelectorAll('.fg-cell').length
      });
    });
  }

  controls.multiSelect.addEventListener('change', function(event) {
    grid.setMultiSelectRows(event.target.checked);
    saveCurrentDemoSettings();
  });

  controls.editMode.addEventListener('change', function(event) {
    grid.setEditMode(event.target.checked);
    saveCurrentDemoSettings();
  });

  document.getElementById('exportButton').addEventListener('click', function() {
    grid.exportCsv('fastgrid-demo.csv');
  });

  document.getElementById('exportExcelButton').addEventListener('click', function() {
    grid.exportExcel('fastgrid-demo.xlsx').catch(function(error) {
      window.setTimeout(function() {
        throw error;
      }, 0);
    });
  });

  window.fastGridDemo = {
    grid: grid,
    rows: rows,
    columns: columns,
    themes: DEMO_THEMES
  };

  function createColumns(count) {
    var columns = [
      { binding: 'id', header: '主要廠商', width: 88, minWidth: 72, align: 'center', dataType: 'string', readOnly: true },
      { binding: 'name', header: '簡稱', width: 108, minWidth: 88, dataType: 'string', readOnly: true },
      {
        binding: 'refCode',
        header: '訂單編號',
        width: 130,
        minWidth: 100,
        dataType: 'string',
        editor: {
          type: 'textbox',
          icons: [
            {
              iconCls: 'icon-refwin',
              title: '選擇參照',
              ariaLabel: '選擇參照',
              onClick: function(args) {
                args.editor.value = 'BO' + pad(args.row + 1) + '001';
                args.editor.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          ]
        }
      },
      {
        binding: 'date',
        header: '單據日期',
        width: 104,
        minWidth: 92,
        dataType: 'date',
        editor: 'datebox',
        mask: '9999-99-99'
      },
      {
        binding: 'status',
        header: '幣別',
        width: 62,
        minWidth: 56,
        align: 'center',
        dataType: 'string',
        readOnly: true
      },
      {
        binding: 'category',
        header: '項目',
        width: 64,
        minWidth: 56,
        align: 'center',
        dataType: 'string',
        readOnly: true
      },
      {
        binding: 'amount',
        header: '應付金額',
        width: 140,
        minWidth: 90,
        align: 'right',
        color: 'blue',
        dataType: 'number',
        aggregate: 'sum',
        thousandsSeparator: true,
        precision: 2,
        editor: {
          type: 'numberbox'
        },
        validate: function(args) {
          var value = args.value;
          if (value != null && (!isFinite(value) || value < 0 || value > 1000000)) {
            return {
              type: 'range',
              message: '金額必須介於 0 到 1,000,000',
              value: args.value
            };
          }
          return null;
        }
      },
      {
        binding: 'popupCode',
        header: '敘述',
        width: 240,
        minWidth: 120,
        dataType: 'string',
        search: {
          icons: [
            {
              iconCls: 'icon-refwin',
              title: '開啟參考查詢',
              ariaLabel: '開啟參考查詢',
              onClick: showLookupPopup
            }
          ]
        },
        editor: {
          type: 'textbox',
          icons: [
            {
              iconCls: 'icon-refwin',
              title: '開啟參考查詢',
              ariaLabel: '開啟參考查詢',
              onClick: showLookupPopup
            }
          ]
        }
      },
      {
        binding: 'score',
        header: '分數(非同步)',
        width: 120,
        minWidth: 100,
        align: 'right',
        dataType: 'number',
        aggregate: 'avg',
        editor: 'numberbox',
        validate: function(args) {
          return new Promise(function(resolve) {
            var value = args.value;
            setTimeout(function() {
              if (value != null && (!isFinite(value) || value < 0 || value > 100)) {
                resolve({
                  type: 'range',
                  message: '分數必須介於 0 到 100',
                  value: args.value
                });
                return;
              }
              resolve(null);
            }, 120);
          });
        },
        footerFormatter: function(value) {
          if (value == null || value === '') {
            return '';
          }
          return Number(value).toLocaleString('zh-TW', { maximumFractionDigits: 1 });
        }
      },
      {
        binding: 'textDate',
        header: '文字日期',
        width: 120,
        minWidth: 100,
        dataType: 'string',
        editor: 'datebox',
        readOnly: false,
        mask: '9999/99/99',
        autoUnmask: true
      },
      {
        binding: 'yearMonth',
        header: '年月',
        width: 110,
        minWidth: 90,
        dataType: 'string',
        editor: 'yymmbox',
        mask: '9999/99',
        autoUnmask: true
      }
    ];
    var i;
    for (i = columns.length + 1; i <= count; i += 1) {
      columns.push({
        binding: 'col' + pad(i),
        header: '欄位 ' + i,
        width: i % 3 === 0 ? 150 : 120,
        minWidth: 80,
        dataType: i % 4 === 0 ? 'number' : 'string',
        align: i % 4 === 0 ? 'right' : '',
        aggregate: i % 4 === 0 ? 'sum' : null
      });
    }
    return columns;
  }

  function createRows(count, columnCount) {
    var vendors = [
      { code: '408042', name: '全得' },
      { code: '724001', name: '凱士' },
      { code: '114021', name: '凱銳' },
      { code: '307018', name: '翔曜' },
      { code: '520033', name: '瑞禾' }
    ];
    var descriptions = [
      '第一期工程款20%(未稅金額)',
      '第二期工程款60%(未稅金額)',
      '第三期工程款20%(未稅金額)',
      '工程款30%訂金',
      '工程款30%中款'
    ];
    var rows = [];
    var row;
    var vendor;
    var groupIndex;
    var lineInGroup;
    var groupSize;
    var orderNo;
    var i;
    var c;
    for (i = 1; i <= count; i += 1) {
      groupIndex = Math.floor((i - 1) / 3);
      lineInGroup = (i - 1) % 3;
      groupSize = groupIndex % 5 === 0 ? 1 : 3;
      vendor = vendors[groupIndex % vendors.length];
      orderNo = 'BO' + (2025000000 + groupIndex * 1005 + 27);
      row = {
        id: vendor.code,
        name: vendor.name,
        region: '',
        status: 'NTD',
        category: pad((lineInGroup + 1) * 10),
        refCode: orderNo,
        popupCode: descriptions[(groupIndex + lineInGroup) % descriptions.length],
        amount: groupSize === 1 ? 6700 : Math.round(((groupIndex + 3) * 374398.33) / groupSize),
        score: (i * 17) % 100,
        textDate: createTextDateValue(i),
        yearMonth: createYearMonthValue(i),
        date: createOrderDateValue(groupIndex)
      };
      for (c = 10; c <= columnCount; c += 1) {
        row['col' + pad(c)] = c % 4 === 0 ? (i * c) % 10000 : 'R' + i + '-C' + c;
      }
      rows.push(row);
      if (groupSize === 1) {
        i += 2;
      }
    }
    return rows;
  }

  function createOrderDateValue(index) {
    var day = (index % 26) + 1;
    var month = index % 3 === 0 ? 4 : 5;
    return '2026-' + pad(month) + '-' + pad(day);
  }

  function createTextDateValue(index) {
    if (index % 9 === 0) {
      return '2025' + pad((index % 12) + 1) + pad((index % 28) + 1);
    }
    if (index % 5 === 0) {
      return '202606' + pad((index % 28) + 1);
    }
    return '202607' + pad((index % 28) + 1);
  }

  function createYearMonthValue(index) {
    if (index % 9 === 0) {
      return '2025' + pad((index % 12) + 1);
    }
    if (index % 5 === 0) {
      return '202606';
    }
    return '202607';
  }

  function createDateValue(index) {
    if (index % 9 === 0) {
      return '2025-' + pad((index % 12) + 1) + '-' + pad((index % 28) + 1);
    }
    if (index % 5 === 0) {
      return '2026-06-' + pad((index % 28) + 1);
    }
    return '2026-07-' + pad((index % 28) + 1);
  }

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function showLookupPopup(args) {
    lookupEditorArgs = args;
    ensureLookupPopup();
    lookupPopup.overlay.style.display = 'flex';
    if (!lookupGrid) {
      lookupGrid = new FastGrid(lookupPopup.gridHost, {
        rowHeight: 32,
        headerHeight: 32,
        overscanRows: 4,
        overscanColumns: 1,
        showRowHeaders: true,
        rowHeaderWidth: 42,
        allowSorting: true,
        allowEditing: false,
        editOnSelect: false,
        itemsSource: createLookupRows(),
        columns: [
          { binding: 'code', header: '代號', width: 96, minWidth: 70, dataType: 'string' },
          { binding: 'orderNo', header: '單號', width: 128, minWidth: 100, dataType: 'string' },
          { binding: 'customer', header: '客戶', width: 90, minWidth: 80, dataType: 'string' },
          { binding: 'name', header: '名稱', width: 100, minWidth: 80, dataType: 'string' },
          { binding: 'qty', header: '合約數量', width: 96, minWidth: 80, align: 'right', dataType: 'number' },
          { binding: 'available', header: '可用餘量', width: 96, minWidth: 80, align: 'right', dataType: 'number' },
          { binding: 'price', header: '單價', width: 84, minWidth: 70, align: 'right', dataType: 'number' },
          { binding: 'status', header: '狀態', width: 96, minWidth: 80, dataType: 'string' }
        ],
        alternatingRows: true,
        alternatingRowBackground: '#fafafa',
        formatCell: function(cellArgs) {
          if (cellArgs.column.binding === 'status' && cellArgs.value !== '買單') {
            cellArgs.cell.style.color = '#1d4ed8';
            cellArgs.cell.style.fontWeight = '600';
          }
        }
      });
      lookupGrid.select(0, 0);
      lookupPopup.gridHost.addEventListener('click', handleLookupGridClick, true);
      lookupPopup.gridHost.addEventListener('dblclick', handleLookupGridDblClick, true);
    } else {
      lookupGrid.invalidate();
      lookupGrid.select(Math.max(0, lookupGrid.selection.row), 0);
    }
    lookupPopup.title.textContent = '參考查詢（客戶合約訂單）';
    lookupPopup.count.textContent = '顯示1到' + lookupGrid.view.length + ',共' + lookupGrid.view.length + '記錄';
    window.setTimeout(function() {
      lookupGrid.invalidate();
      lookupGrid.root.focus();
    }, 0);
  }

  function ensureLookupPopup() {
    var overlay;
    var windowEl;
    var header;
    var title;
    var controls;
    var closeButton;
    var gridHost;
    var pager;
    var count;
    var footer;
    var clearButton;
    var cancelButton;
    var okButton;
    if (lookupPopup) {
      return;
    }
    overlay = document.createElement('div');
    overlay.className = 'lookup-popup-overlay';
    overlay.setAttribute('role', 'presentation');

    windowEl = document.createElement('section');
    windowEl.className = 'lookup-popup-window';
    windowEl.setAttribute('role', 'dialog');
    windowEl.setAttribute('aria-modal', 'true');

    header = document.createElement('div');
    header.className = 'lookup-popup-header';

    title = document.createElement('h2');
    title.className = 'lookup-popup-title';

    controls = document.createElement('div');
    controls.className = 'lookup-popup-controls';

    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'lookup-popup-icon-button icon-close';
    closeButton.title = '關閉';
    closeButton.setAttribute('aria-label', '關閉');
    controls.appendChild(closeButton);
    header.appendChild(title);
    header.appendChild(controls);

    gridHost = document.createElement('div');
    gridHost.className = 'lookup-popup-grid';

    pager = document.createElement('div');
    pager.className = 'lookup-popup-pager';
    pager.innerHTML = '<span>|‹</span><span>‹</span><strong>第 1 共1頁</strong><span>›</span><span>›|</span><span>↻</span>';

    count = document.createElement('span');
    count.className = 'lookup-popup-count';
    pager.appendChild(count);

    footer = document.createElement('div');
    footer.className = 'lookup-popup-footer';

    clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'lookup-popup-button icon-clear';
    clearButton.textContent = '清篩選';

    cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'lookup-popup-button icon-remove';
    cancelButton.textContent = '取消';

    okButton = document.createElement('button');
    okButton.type = 'button';
    okButton.className = 'lookup-popup-button icon-check';
    okButton.textContent = '確定';

    footer.appendChild(clearButton);
    footer.appendChild(cancelButton);
    footer.appendChild(okButton);
    windowEl.appendChild(header);
    windowEl.appendChild(gridHost);
    windowEl.appendChild(pager);
    windowEl.appendChild(footer);
    overlay.appendChild(windowEl);
    document.body.appendChild(overlay);

    lookupPopup = {
      overlay: overlay,
      title: title,
      gridHost: gridHost,
      count: count
    };

    closeButton.addEventListener('click', closeLookupPopup);
    cancelButton.addEventListener('click', closeLookupPopup);
    okButton.addEventListener('click', function() {
      applyLookupPopupValue();
    });
    clearButton.addEventListener('click', function() {
      if (lookupGrid) {
        lookupGrid.clearFilter();
        lookupGrid.setSearch('');
      }
    });
    overlay.addEventListener('mousedown', function(event) {
      if (event.target === overlay) {
        closeLookupPopup();
      }
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && lookupPopup && lookupPopup.overlay.style.display === 'flex') {
        closeLookupPopup();
      }
    });
  }

  function createLookupRows() {
    return [
      { code: '2W001', orderNo: 'SE260701003', customer: 'EG00', name: '高陞旺', qty: 4000, available: 4000, price: 454.2, status: '買單' },
      { code: 'WU001', orderNo: 'SE260701002', customer: 'CU00', name: '和碩', qty: 8000, available: 3097.8, price: 454.2, status: '買單' },
      { code: 'CU004', orderNo: 'SE260701001', customer: '2R00', name: '大晉', qty: 3000, available: 2092.6, price: 429.9, status: '買單' },
      { code: 'BV001', orderNo: 'SE260526001', customer: 'CU00', name: '和碩', qty: 3658.9, available: 0, price: 450.4, status: '使用' },
      { code: 'RM001', orderNo: 'SE260501001', customer: '2R00', name: '大晉', qty: 3000, available: -1250, price: 408.8, status: '使用,結案' },
      { code: 'RW001', orderNo: 'SE151117001', customer: 'C500', name: '宏展', qty: 20000, available: 20000, price: 177, status: '買單' },
      { code: 'JL001', orderNo: 'SE150714001', customer: 'C500', name: '宏展', qty: 72446.4, available: 72446.4, price: 183, status: '買單' },
      { code: 'JP001', orderNo: 'SE150216001', customer: 'C500', name: '宏展', qty: 3000, available: 3000, price: 200, status: '使用,結案' }
    ];
  }

  function applyLookupPopupValue(rowIndex) {
    var value;
    if (!lookupGrid || !lookupEditorArgs || !lookupEditorArgs.editor) {
      closeLookupPopup();
      return;
    }
    rowIndex = rowIndex == null ? Math.max(0, lookupGrid.selection ? lookupGrid.selection.row : 0) : rowIndex;
    value = lookupGrid.getCellData(rowIndex, 0);
    lookupEditorArgs.editor.value = value == null ? '' : String(value);
    lookupEditorArgs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    lookupEditorArgs.editor.focus();
    closeLookupPopup();
  }

  function handleLookupGridDblClick(event) {
    var rowIndex = getLookupEventRowIndex(event);
    if (rowIndex == null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    lookupGrid.select(rowIndex, 0);
    applyLookupPopupValue(rowIndex);
  }

  function handleLookupGridClick(event) {
    var rowIndex = getLookupEventRowIndex(event);
    var now;
    var isDoubleClick;
    if (rowIndex == null) {
      return;
    }
    now = Date.now();
    isDoubleClick = event.detail >= 2 ||
      (lookupLastClick && lookupLastClick.row === rowIndex && now - lookupLastClick.time < 450);
    lookupGrid.select(rowIndex, 0);
    if (isDoubleClick) {
      event.preventDefault();
      event.stopPropagation();
      applyLookupPopupValue(rowIndex);
      lookupLastClick = null;
      return;
    }
    lookupLastClick = {
      row: rowIndex,
      time: now
    };
  }

  function getLookupEventRowIndex(event) {
    var cell = event.target && event.target.closest ? event.target.closest('.fg-cell') : null;
    var rowHeader = event.target && event.target.closest ? event.target.closest('.fg-row-header-cell') : null;
    var selectionCell = event.target && event.target.closest ? event.target.closest('.fg-selection-cell') : null;
    var rowTarget = cell || rowHeader || selectionCell;
    var rowIndex;
    if (!rowTarget || !lookupGrid || !lookupGrid.root.contains(rowTarget)) {
      return null;
    }
    rowIndex = Number(rowTarget.getAttribute('data-row'));
    if (!isFinite(rowIndex)) {
      return null;
    }
    return rowIndex;
  }

  function closeLookupPopup() {
    if (lookupPopup) {
      lookupPopup.overlay.style.display = 'none';
    }
    lookupEditorArgs = null;
    lookupLastClick = null;
  }

  function setToolbarBusy(value) {
    var i;
    for (i = 0; i < toolbarControls.length; i += 1) {
      toolbarControls[i].disabled = value === true;
    }
  }

  function loadDemoSettings() {
    var settings = null;
    var raw;
    try {
      raw = window.localStorage ? window.localStorage.getItem(DEMO_SETTINGS_KEY) : '';
      if (!raw && window.localStorage) {
        raw = window.localStorage.getItem(DEMO_LEGACY_SETTINGS_KEY);
      }
      settings = raw ? JSON.parse(raw) : null;
    } catch (error) {
      settings = null;
    }
    return normalizeDemoSettings(settings);
  }

  function saveCurrentDemoSettings() {
    saveDemoSettings({
      locale: controls.language.value,
      theme: controls.theme.value,
      searchText: controls.search.value,
      frozenColumns: controls.frozen.value,
      frozenRightColumns: controls.frozenRight.value,
      showRowHeaders: controls.rowHeaders.value,
      showSearchRow: controls.searchRow.checked,
      rowGroupMode: controls.groupRows ? controls.groupRows.value : DEFAULT_DEMO_SETTINGS.rowGroupMode,
      multiSelectRows: controls.multiSelect.checked,
      editMode: controls.editMode.checked
    });
  }

  function saveDemoSettings(settings) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(normalizeDemoSettings(settings)));
      }
    } catch (error) {
      return;
    }
  }

  function applyDemoSettingsToControls(settings) {
    controls.language.value = settings.locale;
    controls.theme.value = settings.theme;
    controls.search.value = settings.searchText;
    controls.frozen.value = settings.frozenColumns;
    controls.frozenRight.value = settings.frozenRightColumns;
    controls.rowHeaders.value = settings.showRowHeaders === true ? 'true' : settings.showRowHeaders === 'cell' ? 'cell' : 'false';
    controls.searchRow.checked = settings.showSearchRow;
    if (controls.groupRows) {
      controls.groupRows.value = settings.rowGroupMode;
    }
    controls.multiSelect.checked = settings.multiSelectRows;
    controls.editMode.checked = settings.editMode;
  }

  function normalizeDemoSettings(settings) {
    settings = settings || {};
    return {
      locale: normalizeLocaleSetting(settings.locale, DEFAULT_DEMO_SETTINGS.locale),
      theme: normalizeThemeSetting(settings.theme, DEFAULT_DEMO_SETTINGS.theme),
      searchText: settings.searchText == null ? DEFAULT_DEMO_SETTINGS.searchText : String(settings.searchText),
      frozenColumns: normalizeNumberSetting(settings.frozenColumns, DEFAULT_DEMO_SETTINGS.frozenColumns, 0, 6),
      frozenRightColumns: normalizeNumberSetting(settings.frozenRightColumns, DEFAULT_DEMO_SETTINGS.frozenRightColumns, 0, 6),
      showRowHeaders: normalizeRowHeaderSetting(settings.showRowHeaders, DEFAULT_DEMO_SETTINGS.showRowHeaders),
      showSearchRow: normalizeBooleanSetting(settings.showSearchRow, DEFAULT_DEMO_SETTINGS.showSearchRow),
      rowGroupMode: normalizeRowGroupModeSetting(settings.rowGroupMode, settings.showRowGroups, DEFAULT_DEMO_SETTINGS.rowGroupMode),
      multiSelectRows: normalizeBooleanSetting(settings.multiSelectRows, DEFAULT_DEMO_SETTINGS.multiSelectRows),
      editMode: normalizeBooleanSetting(settings.editMode, DEFAULT_DEMO_SETTINGS.editMode)
    };
  }

  function normalizeNumberSetting(value, defaultValue, min, max) {
    value = Number(value);
    if (!isFinite(value)) {
      value = defaultValue;
    }
    value = Math.round(value);
    return Math.max(min, Math.min(max, value));
  }

  function normalizeBooleanSetting(value, defaultValue) {
    if (value === true || value === false) {
      return value;
    }
    return defaultValue;
  }

  function normalizeRowGroupModeSetting(value, legacyValue, defaultValue) {
    var text = value == null ? '' : String(value).toLowerCase();
    if (text === 'none' || text === 'order' || text === 'vendor' || text === 'vendor-order') {
      return text;
    }
    if (legacyValue === false) {
      return 'none';
    }
    if (legacyValue === true) {
      return 'order';
    }
    return defaultValue;
  }

  function normalizeRowHeaderSetting(value, defaultValue) {
    var text;
    if (value === true || value === false || value === 'cell') {
      return value;
    }
    text = value == null ? '' : String(value).toLowerCase();
    if (text === 'true' || text === 'number' || text === 'row-number') {
      return true;
    }
    if (text === 'cell' || text === 'blank') {
      return 'cell';
    }
    if (text === 'false' || text === 'none' || text === 'off') {
      return false;
    }
    return defaultValue;
  }

  function normalizeLocaleSetting(value, defaultValue) {
    var text = value == null ? '' : String(value);
    return DEMO_LOCALES[text] ? text : defaultValue;
  }

  function normalizeThemeSetting(value, defaultValue) {
    var text = value == null ? '' : String(value);
    var i;
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      if (DEMO_THEMES[i].value === text) {
        return text;
      }
    }
    return defaultValue;
  }

  function populateThemeOptions() {
    var fragment = document.createDocumentFragment();
    var option;
    var i;
    controls.theme.textContent = '';
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      option = document.createElement('option');
      option.value = DEMO_THEMES[i].value;
      option.textContent = DEMO_THEMES[i].label;
      fragment.appendChild(option);
    }
    controls.theme.appendChild(fragment);
  }

  function loadDemoThemeStyles() {
    var themeRoot = window.FASTGRID_DEMO_THEME_ROOT || '../dist/themes';
    var version = window.FASTGRID_DEMO_THEME_VERSION || '20260708-demo-themes';
    var theme;
    var link;
    var i;
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      theme = DEMO_THEMES[i].value;
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = themeRoot + '/fastgrid.' + theme + '.css?v=' + version;
      document.head.appendChild(link);
    }
  }

  function applyDemoTheme(theme) {
    var i;
    theme = normalizeThemeSetting(theme, DEFAULT_DEMO_SETTINGS.theme);
    controls.theme.value = theme;
    if (!grid || !grid.root) {
      return;
    }
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      grid.root.classList.remove('fg-theme-' + DEMO_THEMES[i].value);
    }
    grid.root.classList.add('fg-theme-' + theme);
  }

  function getDemoText(key) {
    var pack = getDemoLocalePack(controls.language.value);
    return pack[key] || key;
  }

  function getDemoLocalePack(locale) {
    locale = normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale);
    return DEMO_LOCALES[locale] || DEMO_LOCALES[DEFAULT_DEMO_SETTINGS.locale];
  }

  function formatDemoText(text, data) {
    return String(text == null ? '' : text).replace(/\{([^}]+)\}/g, function(match, key) {
      return data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match;
    });
  }

  function formatDemoRowGroupHeader(args) {
    return formatDemoText(getDemoText('groupHeader'), {
      header: getDemoRowGroupHeaderText(args),
      key: args.key,
      count: args.count
    });
  }

  function formatDemoVendorOrderRowGroupHeader(args) {
    return formatDemoText(getDemoText('groupVendorOrderHeader'), {
      header: getDemoRowGroupHeaderText(args),
      vendor: args.item.id,
      order: args.item.refCode,
      count: args.count
    });
  }

  function getDemoRowGroupHeaderText(args) {
    var bindings = args.config && (args.config.bindings || args.config.binding || args.config.fields || args.config.field);
    var header;
    if (args.header) {
      return args.header;
    }
    if (bindings == null) {
      if (args.key === args.item.id) {
        bindings = 'id';
      } else if (args.key === args.item.refCode) {
        bindings = 'refCode';
      } else {
        bindings = ['id', 'refCode'];
      }
    }
    if (!Array.isArray(bindings)) {
      bindings = [bindings];
    }
    header = bindings.map(getDemoColumnHeader).join(' + ');
    return header || getDemoText('groupRows');
  }

  function getDemoColumnHeader(binding) {
    var i;
    for (i = 0; i < columns.length; i += 1) {
      if (columns[i].binding === binding) {
        return columns[i].header;
      }
    }
    return String(binding);
  }

  function getDemoRowGroups(mode) {
    mode = normalizeRowGroupModeSetting(mode, null, DEFAULT_DEMO_SETTINGS.rowGroupMode);
    return DEMO_ROW_GROUPS[mode] ? DEMO_ROW_GROUPS[mode].slice() : [];
  }

  function refreshDemoRowGroups() {
    if (controls.groupRows) {
      grid.setRowGroups(getDemoRowGroups(controls.groupRows.value));
    }
  }

  function updateGroupRowsOptions() {
    var labelsByValue = {
      none: getDemoText('groupNone'),
      order: getDemoText('groupOrder'),
      vendor: getDemoText('groupVendor'),
      'vendor-order': getDemoText('groupVendorOrder')
    };
    var i;
    var option;
    if (!controls.groupRows) {
      return;
    }
    for (i = 0; i < controls.groupRows.options.length; i += 1) {
      option = controls.groupRows.options[i];
      if (Object.prototype.hasOwnProperty.call(labelsByValue, option.value)) {
        option.textContent = labelsByValue[option.value];
      }
    }
  }

  function applyDemoLocale(locale) {
    locale = normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale);
    controls.language.value = locale;
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-Hant';
    labels.search.textContent = getDemoText('search');
    labels.language.textContent = getDemoText('language');
    labels.theme.textContent = getDemoText('theme');
    labels.frozen.textContent = getDemoText('frozen');
    labels.frozenRight.textContent = getDemoText('frozenRight');
    labels.rowHeaders.textContent = getDemoText('rowHeaders');
    labels.searchRow.textContent = getDemoText('searchRow');
    if (labels.groupRows) {
      labels.groupRows.textContent = getDemoText('groupRows');
    }
    updateGroupRowsOptions();
    labels.multiSelect.textContent = getDemoText('multiSelect');
    labels.editMode.textContent = getDemoText('editMode');
    labels.exportCsv.setAttribute('aria-label', getDemoText('exportCsv'));
    labels.exportCsv.setAttribute('title', getDemoText('exportCsv'));
    labels.exportExcel.setAttribute('aria-label', getDemoText('exportExcel'));
    labels.exportExcel.setAttribute('title', getDemoText('exportExcel'));
    controls.search.setAttribute('placeholder', getDemoText('searchPlaceholder'));
  }

  function applyGridColumnHeaderLocale(targetGrid, locale) {
    applyColumnHeaderLocale(columns, locale);
    applyColumnHeaderLocale(targetGrid.columns, locale);
    if (targetGrid.root) {
      targetGrid.renderHeaders(targetGrid.columnRange);
    }
  }

  function applyColumnHeaderLocale(targetColumns, locale) {
    var i;
    var column;
    if (!targetColumns) {
      return;
    }
    for (i = 0; i < targetColumns.length; i += 1) {
      column = targetColumns[i];
      column.header = getColumnHeaderText(column, locale);
    }
  }

  function getColumnHeaderText(column, locale) {
    var headers = getDemoLocalePack(locale).columnHeaders || {};
    var binding = column && column.binding ? String(column.binding) : '';
    var index;
    if (Object.prototype.hasOwnProperty.call(headers, binding)) {
      return headers[binding];
    }
    index = getColumnNumberFromBinding(binding);
    if (index != null) {
      return formatDemoText(headers.defaultColumn || 'Column {index}', { index: index });
    }
    return column && column.header ? column.header : binding;
  }

  function getColumnNumberFromBinding(binding) {
    var match = String(binding || '').match(/^col0*(\d+)$/);
    return match ? Number(match[1]) : null;
  }

  function updateDatasetSummary() {
    if (stats.datasetSummary) {
      stats.datasetSummary.textContent = rows.length + ' x ' + columns.length;
    }
  }

  function updateViewportStats(e) {
    stats.rowCount.textContent = getDemoText('rows') + ': ' + e.totalRows + ' / ' + rows.length;
    stats.rowRange.textContent = getDemoText('rowsVisible') + ': ' + e.rowStart + '-' + Math.max(e.rowStart, e.rowEnd - 1);
    stats.columnRange.textContent = getDemoText('columnsVisible') + ': ' + e.columnStart + '-' + Math.max(e.columnStart, e.columnEnd - 1) + ' / ' + columns.length;
    stats.cellCount.textContent = getDemoText('renderedCells') + ': ' + e.renderedCells;
  }
}());
