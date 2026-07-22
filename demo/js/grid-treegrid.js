(function(root) {
  'use strict';

  var poolCount = document.getElementById('poolRowCount');
  var treeCount = document.getElementById('treeNodeCount');
  var status = document.getElementById('dragDemoStatus');
  var poolGrid;
  var treeGrid;

  function createColumns(tree) {
    return [
      { binding: 'name', header: tree ? '組織／團隊' : '待配置項目', width: tree ? 210 : 170, minWidth: 120 },
      { binding: 'nodeId', header: '代碼', width: 92, minWidth: 78 },
      { binding: 'owner', header: '負責人', width: 90, minWidth: 78 },
      { binding: 'headcount', header: '人數', width: 68, minWidth: 60, dataType: 'number', align: 'right' },
      { binding: 'status', header: '狀態', width: 84, minWidth: 72 }
    ];
  }

  function countTreeNodes(rows) {
    var count = 0;
    var i;
    rows = Array.isArray(rows) ? rows : [];
    for (i = 0; i < rows.length; i += 1) {
      count += 1 + countTreeNodes(rows[i].children);
    }
    return count;
  }

  function updateCounts() {
    poolCount.textContent = poolGrid.source.length + ' 筆';
    treeCount.textContent = countTreeNodes(treeGrid.source) + ' 節點';
  }

  function getPositionText(position) {
    if (position === 'before') {
      return '同層之前';
    }
    if (position === 'after') {
      return '同層之後';
    }
    return '成為子節點';
  }

  function handleDraggedRow(event) {
    if (event.role === 'source') {
      return;
    }
    status.textContent = '已移動「' + event.item.name + '」：' + getPositionText(event.position) +
      (event.targetItem ? '「' + event.targetItem.name + '」' : '根節點尾端');
    updateCounts();
  }

  function createGrids() {
    poolGrid = new root.fabui.FabGrid('#dragSourceGrid', {
      locale: 'zh-TW',
      itemsSource: root.createGridTreeDragPool(),
      columns: createColumns(false),
      allowDragging: 'Rows',
      allowSorting: false,
      allowEditing: false,
      filterMode: ['excel', 'searchRow'],
      frozenColumns: 1,
      rowHeaderWidth: 44,
      alternatingRowStep: 1
    });

    treeGrid = new root.fabui.FabGrid('#dragTargetTree', {
      locale: 'zh-TW',
      itemsSource: root.createGridTreeDragTree(),
      columns: createColumns(true),
      childItemsPath: 'children',
      treeColumn: 'name',
      treeIndent: 20,
      allowDragging: 'Rows',
      allowSorting: false,
      allowEditing: false,
      filterMode: ['excel', 'searchRow'],
      frozenColumns: 1,
      rowHeaderWidth: 44,
      alternatingRowStep: 1
    });

    poolGrid.on('draggedRow', handleDraggedRow);
    treeGrid.on('draggedRow', handleDraggedRow);
    treeGrid.expandAllTreeNodes();
    updateCounts();
    status.textContent = '可開始拖曳：TreeGrid 中央落點會將節點移到下一階。';
  }

  document.getElementById('expandDragTree').addEventListener('click', function() {
    treeGrid.expandAllTreeNodes();
    status.textContent = '已展開所有 TreeGrid 節點。';
  });

  document.getElementById('resetDragDemo').addEventListener('click', function() {
    poolGrid.setItemsSource(root.createGridTreeDragPool());
    treeGrid.setItemsSource(root.createGridTreeDragTree());
    treeGrid.expandAllTreeNodes();
    updateCounts();
    status.textContent = '已重設 Grid 與 TreeGrid 資料。';
  });

  createGrids();

  root.gridTreeGridDemo = {
    poolGrid: poolGrid,
    treeGrid: treeGrid,
    reset: function() {
      document.getElementById('resetDragDemo').click();
    }
  };
}(typeof window !== 'undefined' ? window : this));
