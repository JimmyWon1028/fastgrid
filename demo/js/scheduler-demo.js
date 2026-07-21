(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function createEvents() {
    return [
      {
        id: 1,
        title: '產品週會',
        description: '確認本週產品交付與風險。',
        start: new Date(2026, 6, 20, 9, 0),
        end: new Date(2026, 6, 20, 10, 30),
        roomId: 1
      },
      {
        id: 2,
        title: '設計評審',
        description: 'Scheduler 互動與 RWD 評審。',
        start: new Date(2026, 6, 20, 11, 0),
        end: new Date(2026, 6, 20, 12, 30),
        roomId: 2
      },
      {
        id: 3,
        title: '客戶訪談',
        start: new Date(2026, 6, 21, 13, 30),
        end: new Date(2026, 6, 21, 15, 0),
        roomId: 1
      },
      {
        id: 4,
        title: '版本封版',
        start: new Date(2026, 6, 22),
        end: new Date(2026, 6, 23),
        isAllDay: true,
        roomId: 2
      },
      {
        id: 5,
        title: '效能測試',
        start: new Date(2026, 6, 23, 10, 0),
        end: new Date(2026, 6, 23, 12, 0),
        roomId: 2
      },
      {
        id: 6,
        title: '迭代回顧',
        start: new Date(2026, 6, 24, 15, 0),
        end: new Date(2026, 6, 24, 16, 30),
        roomId: 1
      }
    ];
  }

  function mountSchedulerDemo(fabui) {
    var themeSelect = document.getElementById('scheduler-theme');
    var localeSelect = document.getElementById('scheduler-locale');
    var addButton = document.getElementById('scheduler-add');
    var status = document.getElementById('scheduler-status');
    var scheduler;

    function setStatus(text) {
      status.textContent = text;
    }

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      if (scheduler) scheduler.setTheme('inherit');
    }

    if (!fabui || typeof fabui.Scheduler !== 'function') {
      throw new Error(
        'fabui.Scheduler is unavailable. Load fabui.* before fabui.scheduler.*.'
      );
    }

    applyTheme('default');
    scheduler = new fabui.Scheduler('#scheduler', {
      date: new Date(2026, 6, 20),
      currentView: 'workWeek',
      height: '100%',
      locale: 'zh-TW',
      theme: 'inherit',
      startTime: '07:00',
      endTime: '20:00',
      scrollTime: '08:00',
      slotDuration: 30,
      dataSource: createEvents(),
      resources: [
        {
          field: 'roomId',
          title: '會議室',
          dataSource: [
            { text: '海洋會議室', value: 1, color: '#2572c0' },
            { text: '森林會議室', value: 2, color: '#2f8f63' }
          ]
        }
      ],
      onNavigate: function(instance, args) {
        setStatus('切換：' + args.view);
      },
      onChange: function(instance, args) {
        setStatus('選取：' + (args.event.title || '無標題'));
      },
      onSave: function(instance, args) {
        setStatus((args.isNew ? '新增：' : '儲存：') +
          (args.event.title || '無標題'));
      },
      onRemove: function(instance, args) {
        setStatus('刪除：' + (args.event.title || '無標題'));
      },
      onMove: function(instance, args) {
        setStatus('已移動：' + (args.event.title || '無標題'));
      },
      onResize: function(instance, args) {
        setStatus('已調整時間：' + (args.event.title || '無標題'));
      }
    });

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
      setStatus('主題：' + themeSelect.value);
    });
    localeSelect.addEventListener('change', function() {
      scheduler.setLocale(localeSelect.value);
      setStatus('語系：' + localeSelect.value);
    });
    addButton.addEventListener('click', function() {
      var start = scheduler.date();
      start.setHours(10, 0, 0, 0);
      scheduler.openEditor({
        start: start,
        end: new Date(start.getTime() + 60 * 60 * 1000),
        roomId: 1
      });
    });

    global.fabSchedulerDemo = scheduler;
    setStatus('Scheduler Demo 已就緒');
  }

  global.mountFabUISchedulerDemo = mountSchedulerDemo;
}(typeof window !== 'undefined' ? window : this));
