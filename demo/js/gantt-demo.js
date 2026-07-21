(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function date(day, hour) {
    return new Date(2026, 6, day, hour || 9, 0, 0, 0);
  }

  function createTasks() {
    return [
      {
        id: 1,
        parentId: null,
        orderId: 0,
        title: 'FabUI Gantt',
        start: date(6),
        end: date(31, 18),
        percentComplete: 0.54,
        summary: true,
        expanded: true,
        resources: ['FabUI Team']
      },
      {
        id: 2,
        parentId: 1,
        orderId: 0,
        title: '需求與架構',
        start: date(6),
        end: date(10, 18),
        percentComplete: 1,
        summary: true,
        expanded: true
      },
      {
        id: 3,
        parentId: 2,
        orderId: 0,
        title: '規格盤點',
        start: date(6),
        end: date(7, 18),
        percentComplete: 1,
        resources: ['Product']
      },
      {
        id: 4,
        parentId: 2,
        orderId: 1,
        title: '資料模型與 API',
        start: date(8),
        end: date(10, 18),
        percentComplete: 1,
        resources: ['Architecture']
      },
      {
        id: 5,
        parentId: 1,
        orderId: 1,
        title: '元件實作',
        start: date(11),
        end: date(24, 18),
        percentComplete: 0.62,
        summary: true,
        expanded: true
      },
      {
        id: 6,
        parentId: 5,
        orderId: 0,
        title: 'TreeList 與 Splitter',
        start: date(11),
        end: date(15, 18),
        percentComplete: 1,
        resources: ['Jimmy']
      },
      {
        id: 7,
        parentId: 5,
        orderId: 1,
        title: 'Timeline 與 View',
        start: date(14),
        end: date(18, 18),
        percentComplete: 0.85,
        resources: ['Frontend']
      },
      {
        id: 8,
        parentId: 5,
        orderId: 2,
        title: '任務拖曳與縮放',
        start: date(17),
        end: date(21, 18),
        percentComplete: 0.5,
        resources: ['Interaction']
      },
      {
        id: 9,
        parentId: 5,
        orderId: 3,
        title: '相依線與里程碑',
        start: date(20),
        end: date(24, 18),
        percentComplete: 0.2,
        resources: ['SVG']
      },
      {
        id: 10,
        parentId: 1,
        orderId: 2,
        title: '驗證與文件',
        start: date(24),
        end: date(30, 18),
        percentComplete: 0.15,
        summary: true,
        expanded: true
      },
      {
        id: 11,
        parentId: 10,
        orderId: 0,
        title: '單元與瀏覽器測試',
        start: date(24),
        end: date(28, 18),
        percentComplete: 0.2,
        resources: ['QA']
      },
      {
        id: 12,
        parentId: 10,
        orderId: 1,
        title: 'API 與載入文件',
        start: date(27),
        end: date(30, 18),
        percentComplete: 0.05,
        resources: ['Docs']
      },
      {
        id: 13,
        parentId: 1,
        orderId: 3,
        title: 'Release',
        start: date(31, 12),
        end: date(31, 12),
        percentComplete: 0,
        milestone: true,
        resources: ['FabUI Team']
      }
    ];
  }

  function createDependencies() {
    return [
      { id: 1, predecessorId: 3, successorId: 4, type: 'FS' },
      { id: 2, predecessorId: 4, successorId: 6, type: 'FS' },
      { id: 3, predecessorId: 6, successorId: 7, type: 'FS' },
      { id: 4, predecessorId: 7, successorId: 8, type: 'FS' },
      { id: 5, predecessorId: 8, successorId: 9, type: 'FS' },
      { id: 6, predecessorId: 9, successorId: 11, type: 'FS' },
      { id: 7, predecessorId: 11, successorId: 13, type: 'FS' },
      { id: 8, predecessorId: 12, successorId: 13, type: 'FS' }
    ];
  }

  function mountGanttDemo(fabui) {
    var themeHost = document.getElementById('gantt-theme');
    var localeHost = document.getElementById('gantt-locale');
    var status = document.getElementById('gantt-status');
    var themeControl;
    var localeControl;
    var actionControls = [];
    var gantt;

    if (!fabui || typeof fabui.Gantt !== 'function') {
      throw new Error('fabui.Gantt is unavailable. Load FabUI core before fabui.gantt.');
    }

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      gantt.setTheme('inherit');
      themeControl.setTheme('inherit');
      localeControl.setTheme('inherit');
      actionControls.forEach(function(control) {
        control.setTheme('inherit');
      });
    }

    gantt = new fabui.Gantt('#gantt', {
      dataSource: createTasks(),
      dependencies: createDependencies(),
      date: date(20),
      view: 'week',
      locale: 'zh-TW',
      theme: 'inherit',
      height: 640,
      listWidth: 560,
      onChange: function(sender, args) {
        status.textContent = '選取：' + args.task.title;
      },
      onUpdate: function(sender, args) {
        status.textContent = '更新：' + args.task.title + '（' + args.action + '）';
      },
      onViewChange: function(sender, args) {
        status.textContent = 'View：' + args.view;
      }
    });

    themeControl = new fabui.EditBox(themeHost, {
      editor: 'combo',
      label: '主題',
      labelWidth: 44,
      width: 220,
      editable: false,
      limitToList: true,
      panelHeight: 260,
      theme: 'inherit',
      onChange: function(value) {
        applyTheme(value);
        status.textContent = '主題：' + value;
      }
    });
    localeControl = new fabui.EditBox(localeHost, {
      editor: 'combo',
      label: '語系',
      labelWidth: 44,
      width: 170,
      editable: false,
      limitToList: true,
      panelHeight: 'auto',
      theme: 'inherit',
      onChange: function(value) {
        gantt.setLocale(value);
        status.textContent = '語系：' + value;
      }
    });
    ['gantt-expand', 'gantt-collapse', 'gantt-today'].forEach(function(id) {
      actionControls.push(new fabui.Button('#' + id, {
        theme: 'inherit',
        plain: true
      }));
    });
    document.getElementById('gantt-expand').addEventListener('click', function() {
      gantt.expandAll();
      status.textContent = '已展開全部任務';
    });
    document.getElementById('gantt-collapse').addEventListener('click', function() {
      gantt.collapseAll();
      status.textContent = '已收合全部任務';
    });
    document.getElementById('gantt-today').addEventListener('click', function() {
      gantt.scrollToDate(date(20));
      status.textContent = '已捲動到 2026/7/20';
    });
    applyTheme(themeHost.value);
    gantt.scrollToDate(date(20));
    status.textContent = 'FabUI Gantt Demo 已就緒';
    global.fabGanttDemo = {
      gantt: gantt,
      theme: themeControl,
      locale: localeControl,
      buttons: actionControls
    };
  }

  global.mountFabUIGanttDemo = mountGanttDemo;
}(typeof window !== 'undefined' ? window : this));
