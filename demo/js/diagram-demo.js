(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];
  var initialData = {
    nodes: [{
      id: 'title',
      type: 'text',
      text: '生產製造流程',
      x: 426,
      y: 8,
      width: 310,
      height: 38,
      fill: '#ffffff',
      stroke: '#ffffff',
      textColor: '#111111',
      fontSize: 28,
      fontUnderline: true
    }, {
      id: 'customer-order',
      type: 'dfdDataStore',
      text: '客戶訂單',
      x: 38,
      y: 88,
      width: 135,
      height: 54,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.6,
      textColor: '#111111'
    }, {
      id: 'stock-quantity',
      type: 'text',
      text: '庫存生產數量',
      x: 190,
      y: 92,
      width: 155,
      height: 40,
      fill: '#ffffff',
      stroke: '#ffffff',
      textColor: '#111111'
    }, {
      id: 'manufacturing-order',
      type: 'dfdProcess',
      text: '開立製令',
      x: 207,
      y: 199,
      width: 106,
      height: 106,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.8,
      textColor: '#111111'
    }, {
      id: 'order-note',
      type: 'text',
      text: '製令只能一個料號\n如有插單, 改機台\n皆需開立新的製令',
      x: 185,
      y: 307,
      width: 166,
      height: 70,
      fill: '#ffffff',
      stroke: '#ffffff',
      textColor: '#111111'
    }, {
      id: 'manufacturing-details',
      type: 'dfdDataStore',
      text: '投料日(預計開始日)\n需求日(預計完工日)\n完工日／工序版型，配料，員工\n機台，機台使用批次(年度)',
      x: 405,
      y: 267,
      width: 230,
      height: 138,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.6,
      textColor: '#111111'
    }, {
      id: 'warehouse-issue',
      type: 'dfdProcess',
      text: '倉庫：領料\n投入生產',
      x: 727,
      y: 185,
      width: 106,
      height: 106,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.8,
      textColor: '#111111'
    }, {
      id: 'deduct-stock',
      type: 'dfdDataStore',
      text: '扣庫存',
      x: 752,
      y: 90,
      width: 175,
      height: 48,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.6,
      textColor: '#111111'
    }, {
      id: 'first-operation',
      type: 'dfdDataStore',
      text: '投料量\n紀錄第一工序',
      x: 915,
      y: 305,
      width: 176,
      height: 64,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.6,
      textColor: '#111111'
    }, {
      id: 'production-operation',
      type: 'dfdProcess',
      text: '生產工序N',
      x: 949,
      y: 445,
      width: 106,
      height: 106,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.8,
      textColor: '#111111'
    }, {
      id: 'production-progress',
      type: 'dfdDataStore',
      text: '生產進度(進度)\n損耗數量',
      x: 685,
      y: 637,
      width: 177,
      height: 65,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.6,
      textColor: '#111111'
    }, {
      id: 'finished-stock',
      type: 'dfdProcess',
      text: '完工入庫',
      x: 437,
      y: 524,
      width: 106,
      height: 106,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.8,
      textColor: '#111111'
    }, {
      id: 'finished-writeback',
      type: 'dfdDataStore',
      text: '完工入庫\n回寫完工數量\n檢查是否結案',
      x: 122,
      y: 688,
      width: 178,
      height: 76,
      fill: '#ffffff',
      stroke: '#666666',
      strokeWidth: 1.6,
      textColor: '#111111'
    }, {
      id: 'close-order',
      type: 'text',
      text: '制令結案:\n1. 產出數量 = 預計生產量\n2. 經紗用完\n3. 手動結案',
      x: 105,
      y: 608,
      width: 215,
      height: 75,
      fill: '#ffffff',
      stroke: '#ffffff',
      textColor: '#111111'
    }],
    connectors: [{
      id: 'c1',
      from: 'customer-order',
      to: 'manufacturing-order',
      type: 'sCurve',
      text: 'Email或傳真',
      fromPoint: 'bottom',
      toPoint: 'leftTop',
      stroke: '#666666'
    }, {
      id: 'c2',
      from: 'stock-quantity',
      to: 'manufacturing-order',
      type: 'straight',
      fromPoint: 'bottom',
      toPoint: 'top',
      stroke: '#666666'
    }, {
      id: 'c3',
      from: 'manufacturing-order',
      to: 'manufacturing-details',
      type: 'sCurve',
      fromPoint: 'rightBottom',
      toPoint: 'leftTop',
      stroke: '#666666'
    }, {
      id: 'c4',
      from: 'manufacturing-details',
      to: 'warehouse-issue',
      type: 'sCurve',
      fromPoint: 'rightTop',
      toPoint: 'leftBottom',
      stroke: '#666666'
    }, {
      id: 'c5',
      from: 'warehouse-issue',
      to: 'first-operation',
      type: 'sCurve',
      fromPoint: 'rightBottom',
      toPoint: 'top',
      stroke: '#666666'
    }, {
      id: 'c6',
      from: 'warehouse-issue',
      to: 'deduct-stock',
      type: 'sCurve',
      fromPoint: 'top',
      toPoint: 'bottom',
      stroke: '#666666'
    }, {
      id: 'c7',
      from: 'first-operation',
      to: 'production-operation',
      type: 'straight',
      fromPoint: 'bottom',
      toPoint: 'top',
      stroke: '#666666'
    }, {
      id: 'c8',
      from: 'production-operation',
      to: 'production-progress',
      type: 'sCurve',
      fromPoint: 'bottom',
      toPoint: 'rightBottom',
      stroke: '#666666'
    }, {
      id: 'c9',
      from: 'production-progress',
      to: 'production-operation',
      type: 'sCurve',
      fromPoint: 'top',
      toPoint: 'leftBottom',
      stroke: '#666666'
    }, {
      id: 'c10',
      from: 'production-progress',
      to: 'finished-stock',
      type: 'sCurve',
      fromPoint: 'leftTop',
      toPoint: 'rightBottom',
      stroke: '#666666'
    }, {
      id: 'c11',
      from: 'finished-stock',
      to: 'finished-writeback',
      type: 'sCurve',
      fromPoint: 'leftBottom',
      toPoint: 'rightBottom',
      stroke: '#666666'
    }]
  };

  function mountDiagramDemo(fabui) {
    var themeSelect = document.getElementById('diagram-theme');
    var localeSelect = document.getElementById('diagram-locale');
    var dockModeSelect = document.getElementById('diagram-dock-mode');
    var readOnly = document.getElementById('diagram-readonly');
    var status = document.getElementById('diagram-status');
    var demoData = initialData;
    var diagram;

    function setStatus(message) {
      status.textContent = message;
    }

    function syncReadOnlyControl(value) {
      var control = readOnly.__fabuiDevControl;
      readOnly.checked = Boolean(value);
      if (!control || control.isChecked() === Boolean(value)) return;
      if (value) control.check();
      else control.uncheck();
    }

    if (!fabui || typeof fabui.Diagram !== 'function') {
      throw new Error('fabui.Diagram class is unavailable.');
    }

    diagram = new fabui.Diagram('#diagram', {
      height: 660,
      locale: localeSelect.value,
      showGrid: false,
      sameSideDockMode: dockModeSelect ? dockModeSelect.value : 'tabs',
      toolboxStateKey: 'fabui.diagram.demo.toolbox',
      nodes: initialData.nodes,
      connectors: initialData.connectors,
      onSelectionChanged: function(instance, event) {
        setStatus(event.selections && event.selections.length > 1 ?
          '已選取 ' + event.selections.length + ' 個圖形' :
          event.item ?
          '選取：' + (event.item.text || event.item.id) :
          '未選取項目');
      },
      onChanged: function(instance, event) {
        setStatus('異動：' + event.action + '，節點 ' +
          event.data.nodes.length + '，連線 ' + event.data.connectors.length);
        if (event.action === 'pageChange' &&
          typeof instance.fitToPage === 'function') {
          instance.fitToPage();
        }
      },
      onReadOnlyChanged: function(instance, event) {
        syncReadOnlyControl(event.readOnly);
      }
    });
    if (typeof diagram.fitToPage === 'function') diagram.fitToPage();
    if (dockModeSelect && typeof diagram.getSameSideDockMode === 'function') {
      dockModeSelect.value = diagram.getSameSideDockMode();
    }

    themeSelect.addEventListener('change', function() {
      THEMES.forEach(function(theme) {
        document.body.classList.remove('fg-theme-' + theme);
      });
      document.body.classList.add('fg-theme-' + themeSelect.value);
      diagram.setTheme('inherit');
    });

    localeSelect.addEventListener('change', function() {
      diagram.setLocale(localeSelect.value);
    });

    if (dockModeSelect) {
      dockModeSelect.addEventListener('change', function() {
        diagram.setSameSideDockMode(dockModeSelect.value);
      });
    }

    readOnly.addEventListener('change', function() {
      diagram.setReadOnly(readOnly.checked);
    });

    document.getElementById('diagram-reset').addEventListener('click', function() {
      diagram.setData(demoData);
      if (typeof diagram.fitToPage === 'function') diagram.fitToPage();
      setStatus('已還原範例流程');
    });

    document.getElementById('diagram-export-json').addEventListener('click', function() {
      diagram.export('fabui-diagram.json');
    });

    document.getElementById('diagram-export-svg').addEventListener('click', function() {
      diagram.exportSvg('fabui-diagram.svg');
    });

    document.getElementById('diagram-fit').addEventListener('click', function() {
      diagram.fitToContent();
    });

    global.fabuiDiagramDemo = diagram;
  }

  global.mountFabUIDiagramDemo = mountDiagramDemo;
}(typeof window !== 'undefined' ? window : this));
