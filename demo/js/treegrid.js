// TreeGrid demo entry.
(function(root) {
  'use strict';

  var itemsSource = root.createTreeGridDemoData();
  var rowCount = document.getElementById('treeRowCount');
  var lastAction = document.getElementById('treeLastAction');
  var quickSearch = document.getElementById('treeQuickSearch');
  var quickSearchModeButton = document.getElementById('treeQuickSearchMode');
  var quickSearchClearButton = document.getElementById('treeQuickSearchClear');
  var searchRowToggle = document.getElementById('treeSearchRowToggle');
  var rowHeaderMode = document.getElementById('treeRowHeaderMode');
  var quickSearchMode = 'or';
  var columns = [
    { binding: 'name', header: '組織／團隊', width: 280, minWidth: 170 },
    { binding: 'nodeId', header: '代碼', width: 100, align: 'center', readOnly: true },
    { binding: 'nodeType', header: '類型', width: 90, align: 'center' },
    { binding: 'owner', header: '負責人', width: 110 },
    { binding: 'status', header: '狀態', width: 100, align: 'center' },
    { binding: 'headcount', header: '人數', width: 80, align: 'right', dataType: 'number' },
    { binding: 'budget', header: '年度預算', width: 140, align: 'right', dataType: 'number', thousandsSeparator: true }
  ];
  var grid = new root.fabui.FabGrid('#treeGrid', {
    itemsSource: itemsSource,
    childItemsPath: 'children',
    treeColumn: 'name',
    treeIndent: 22,
    columns: columns,
    allowEditing: false,
    allowSorting: true,
    allowResizing: true,
    alternatingRowStep: 1,
    frozenColumns: 1,
    showSearchRow: true,
    locale: 'zh-TW'
  });
  function getBindingValue(item, binding) {
    var parts = String(binding || '').split('.');
    var value = item;
    var i;
    for (i = 0; i < parts.length; i += 1) {
      if (value == null) {
        return '';
      }
      value = value[parts[i]];
    }
    return value;
  }

  function applyQuickSearch(value) {
    var terms = String(value == null ? '' : value)
      .split(',')
      .map(function(term) {
        return term.trim().toLowerCase();
      })
      .filter(function(term) {
        return term !== '';
      });
    if (!terms.length) {
      grid.setFilter(null);
      return;
    }
    grid.setFilter(function(item) {
      return terms[quickSearchMode === 'and' ? 'every' : 'some'](function(term) {
        return columns.some(function(column) {
          return String(getBindingValue(item, column.binding)).toLowerCase().indexOf(term) >= 0;
        });
      });
    });
  }

  function updateQuickSearchMode() {
    var label = quickSearchMode === 'and' ? '&' : 'OR';
    quickSearchModeButton.textContent = label;
    quickSearchModeButton.classList.toggle('tree-filter-mode-and', quickSearchMode === 'and');
    quickSearchModeButton.setAttribute('aria-label', label);
    quickSearchModeButton.setAttribute('title', label);
  }

  function updateStats(action) {
    rowCount.textContent = '目前可視節點：' + grid.view.length;
    if (action) {
      lastAction.textContent = action;
    }
  }

  grid.collapseGroupsToLevel(1);
  updateStats('已展開第一層');

  grid.on('groupCollapsedChanged', function(event) {
    if (!event.tree) {
      return;
    }
    updateStats((event.collapsed ? '已收合：' : '已展開：') + event.item.name);
  });

  grid.on('viewportChanged', function() {
    updateStats();
  });

  grid.on('treeContextMenuAction', function(event) {
    updateStats(event.collapsed ? '已疊合所有節點' : '已展開所有節點');
  });

  grid.on('searchCleared', function() {
    quickSearch.value = '';
    grid.setFilter(null);
    updateStats('已清除所有搜尋條件');
  });

  grid.on('searchRowVisibilityChanged', function(event) {
    if (searchRowToggle) {
      searchRowToggle.checked = event.visible === true;
    }
  });

  grid.on('rowHeaderModeChanged', function(event) {
    if (rowHeaderMode) {
      rowHeaderMode.value =
        event.mode === true ? 'true' : event.mode === 'cell' ? 'cell' : 'false';
    }
  });

  quickSearch.addEventListener('input', function(event) {
    applyQuickSearch(event.target.value);
    updateStats(event.target.value ? '快速搜尋：' + event.target.value : '已清除快速搜尋');
  });

  quickSearchModeButton.addEventListener('click', function() {
    quickSearchMode = quickSearchMode === 'and' ? 'or' : 'and';
    updateQuickSearchMode();
    applyQuickSearch(quickSearch.value);
    updateStats('快速搜尋模式：' + (quickSearchMode === 'and' ? 'AND' : 'OR'));
  });

  quickSearchClearButton.addEventListener('click', function() {
    quickSearch.value = '';
    applyQuickSearch('');
    quickSearch.focus();
    updateStats('已清除快速搜尋');
  });

  if (searchRowToggle) {
    searchRowToggle.addEventListener('change', function(event) {
      if (!event.target.checked) {
        grid.clearColumnSearch();
      }
      grid.setShowSearchRow(event.target.checked);
      updateStats(event.target.checked ? '已顯示搜尋列' : '已隱藏搜尋列');
    });
  }

  if (rowHeaderMode) {
    rowHeaderMode.addEventListener('change', function(event) {
      var value = event.target.value;
      grid.setShowRowHeaders(value === 'true' ? true : value === 'cell' ? 'cell' : false);
      updateStats(value === 'true' ? '列號：顯示列號' : value === 'cell' ? '列號：只顯示 cell' : '列號：關閉');
    });
  }

  document.getElementById('collapseTree').addEventListener('click', function() {
    grid.collapseGroupsToLevel(0);
    updateStats('已收合所有節點');
  });

  document.getElementById('expandTree').addEventListener('click', function() {
    grid.expandAllTreeNodes();
    updateStats('已展開所有節點');
  });

  updateQuickSearchMode();

  root.treeGridDemo = {
    grid: grid,
    itemsSource: itemsSource
  };
}(typeof window !== 'undefined' ? window : this));
