(function(root) {
  'use strict';

  var leftCount = document.getElementById('leftGridCount');
  var rightCount = document.getElementById('rightGridCount');
  var status = document.getElementById('gridGridStatus');
  var leftGrid;
  var rightGrid;

  function createColumns() {
    return [
      { binding: 'name', header: '工作項目', width: 150, minWidth: 110 },
      { binding: 'taskId', header: '編號', width: 96, minWidth: 82 },
      { binding: 'owner', header: '負責人', width: 88, minWidth: 76 },
      { binding: 'priority', header: '優先級', width: 76, minWidth: 68, align: 'center' },
      { binding: 'hours', header: '工時', width: 66, minWidth: 58, dataType: 'number', align: 'right' },
      { binding: 'status', header: '狀態', width: 82, minWidth: 70 }
    ];
  }

  function getGridName(grid) {
    return grid === leftGrid ? '待辦工作' : '進行中';
  }

  function getPositionText(position) {
    return position === 'before' ? '之前' : '之後';
  }

  function updateCounts() {
    leftCount.textContent = leftGrid.source.length + ' 筆';
    rightCount.textContent = rightGrid.source.length + ' 筆';
  }

  function handleDraggedRow(event) {
    var targetText;
    if (event.role === 'source') {
      return;
    }
    targetText = event.targetItem ?
      '「' + event.targetItem.name + '」' + getPositionText(event.position) :
      '清單尾端';
    if (event.sourceGrid === event.targetGrid) {
      status.textContent = '已在「' + getGridName(event.targetGrid) + '」重排「' +
        event.item.name + '」，放在' + targetText + '。';
    } else {
      status.textContent = '已將「' + event.item.name + '」從「' + getGridName(event.sourceGrid) +
        '」移到「' + getGridName(event.targetGrid) + '」，放在' + targetText + '。';
    }
    updateCounts();
  }

  function createGrid(selector, rows) {
    return new root.fabui.FabGrid(selector, {
      locale: 'zh-TW',
      itemsSource: rows,
      columns: createColumns(),
      allowDragging: 'Rows',
      allowSorting: false,
      allowEditing: false,
      filterMode: ['excel', 'searchRow'],
      frozenColumns: 1,
      rowHeaderWidth: 44,
      alternatingRowStep: 1
    });
  }

  function createGrids() {
    leftGrid = createGrid('#leftGrid', root.createGridGridLeftRows());
    rightGrid = createGrid('#rightGrid', root.createGridGridRightRows());
    leftGrid.on('draggedRow', handleDraggedRow);
    rightGrid.on('draggedRow', handleDraggedRow);
    updateCounts();
    status.textContent = '可開始拖曳：落在資料列上半部或下半部，決定插入位置。';
  }

  document.getElementById('resetGridGridDemo').addEventListener('click', function() {
    leftGrid.setItemsSource(root.createGridGridLeftRows());
    rightGrid.setItemsSource(root.createGridGridRightRows());
    updateCounts();
    status.textContent = '已重設左右 Grid 資料。';
  });

  createGrids();

  root.gridGridDemo = {
    leftGrid: leftGrid,
    rightGrid: rightGrid,
    reset: function() {
      document.getElementById('resetGridGridDemo').click();
    }
  };
}(typeof window !== 'undefined' ? window : this));
