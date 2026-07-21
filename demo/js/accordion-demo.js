(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function mountAccordionDemo(fabui) {
    var theme = document.getElementById('accordion-theme');
    var multiple = document.getElementById('accordion-multiple');
    var status = document.getElementById('accordion-status');
    var main;
    var horizontal;
    var addedCount = 1;

    function log(message) {
      status.textContent = message;
    }

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      if (main) main.setTheme('inherit');
      if (horizontal) horizontal.setTheme('inherit');
    }

    function selectedTitle() {
      var panel = main.getSelected();
      return panel ? panel.options.title : '無';
    }

    if (!fabui || typeof fabui.Accordion !== 'function') {
      throw new Error('fabui.Accordion class is unavailable.');
    }

    applyTheme(theme.value);
    main = new fabui.Accordion('#basic-accordion', {
      width: '100%',
      height: 330,
      locale: 'zh-TW',
      theme: 'inherit',
      onSelect: function(title) {
        log('已展開：' + title);
      },
      onUnselect: function(title) {
        log('已收合：' + title);
      },
      onAdd: function(title) {
        log('已新增：' + title);
      },
      onRemove: function(title) {
        log('已移除：' + title);
      }
    });
    horizontal = new fabui.Accordion('#horizontal-accordion', {
      width: '100%',
      height: 260,
      halign: 'left',
      locale: 'zh-TW',
      theme: 'inherit'
    });

    theme.addEventListener('change', function() {
      applyTheme(theme.value);
      log('主題：' + theme.value);
    });
    multiple.addEventListener('change', function() {
      main.setOptions({ multiple: multiple.checked });
      log(multiple.checked ? '已啟用多重展開' : '已切換為單一展開');
    });
    document.getElementById('select-next-panel').addEventListener(
      'click',
      function() {
        var current = main.getPanelIndex(main.getSelected());
        var next = (current + 1) % main.panels().length;
        main.select(next);
        log('目前 Panel：' + selectedTitle());
      }
    );
    document.getElementById('add-accordion-panel').addEventListener(
      'click',
      function() {
        main.add({
          title: '動態 Panel ' + addedCount,
          iconCls: 'icon-add',
          content: '<p>這是以 <code>add()</code> 動態加入的內容。</p>'
        });
        addedCount += 1;
      }
    );
    document.getElementById('remove-accordion-panel').addEventListener(
      'click',
      function() {
        var selected = main.getSelected();
        if (!selected) {
          log('目前沒有可移除的 Panel');
          return;
        }
        main.remove(selected);
      }
    );

    global.fabAccordionDemo = {
      main: main,
      horizontal: horizontal
    };
    log('Accordion Demo 已就緒');
  }

  global.mountFabUIAccordionDemo = mountAccordionDemo;
}(typeof window !== 'undefined' ? window : this));
