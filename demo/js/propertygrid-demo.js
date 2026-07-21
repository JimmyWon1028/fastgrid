(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];
  var TEXTS = {
    en: {
      group: 'Show groups',
      noGroup: 'Hide groups',
      header: 'Show header',
      noHeader: 'Hide header',
      changed: 'Changed rows: ',
      accepted: 'Changes accepted',
      rejected: 'Changes rejected',
      selected: 'Selected: ',
      changedValue: 'Changed: '
    },
    'zh-TW': {
      group: '顯示群組',
      noGroup: '隱藏群組',
      header: '顯示標題列',
      noHeader: '隱藏標題列',
      changed: '異動列數：',
      accepted: '已接受異動',
      rejected: '已還原異動',
      selected: '選取：',
      changedValue: '修改：'
    },
    'zh-CN': {
      group: '显示分组',
      noGroup: '隐藏分组',
      header: '显示标题行',
      noHeader: '隐藏标题行',
      changed: '变更行数：',
      accepted: '已接受变更',
      rejected: '已还原变更',
      selected: '选择：',
      changedValue: '修改：'
    }
  };

  function createData() {
    return [{
      name: 'Name',
      value: 'Bill Smith',
      group: 'ID Settings',
      editor: 'text'
    }, {
      name: 'Address',
      value: '',
      group: 'ID Settings',
      editor: 'text'
    }, {
      name: 'Age',
      value: 40,
      group: 'ID Settings',
      editor: {
        type: 'number',
        options: { min: 0, max: 120, precision: 0 }
      }
    }, {
      name: 'Birthday',
      value: '2012/01/02',
      group: 'ID Settings',
      editor: {
        type: 'date',
        options: { mask: '9999/99/99' }
      }
    }, {
      name: 'SSN',
      value: '123-456-7890',
      group: 'ID Settings',
      editor: 'text'
    }, {
      name: 'Email',
      value: 'bill@gmail.com',
      group: 'Marketing Settings',
      editor: 'text'
    }, {
      name: 'Frequent buyer',
      value: false,
      group: 'Marketing Settings',
      editor: 'boolean'
    }, {
      name: 'Tier',
      value: 'Gold',
      group: 'Marketing Settings',
      editor: {
        type: 'combo',
        options: {
          data: [
            { value: 'Standard', text: 'Standard' },
            { value: 'Silver', text: 'Silver' },
            { value: 'Gold', text: 'Gold' }
          ]
        }
      }
    }, {
      name: 'Accent color',
      value: 'steelblue',
      group: 'Appearance',
      editor: 'color'
    }];
  }

  function mountPropertyGridDemo(fabui) {
    var themeSelect = document.getElementById('propertygrid-theme');
    var localeSelect = document.getElementById('propertygrid-locale');
    var status = document.getElementById('propertygrid-status');
    var groupButton = document.getElementById('propertygrid-group');
    var headerButton = document.getElementById('propertygrid-header');
    var showGroup = true;
    var showHeader = true;
    var propertyGrid;

    function text(key) {
      return (TEXTS[localeSelect.value] || TEXTS.en)[key];
    }

    function log(message) {
      status.textContent = message;
    }

    function syncButtons() {
      groupButton.textContent = showGroup ? text('noGroup') : text('group');
      headerButton.textContent = showHeader ? text('noHeader') : text('header');
    }

    if (!fabui || typeof fabui.PropertyGrid !== 'function') {
      throw new Error('fabui.PropertyGrid class is unavailable.');
    }

    propertyGrid = new fabui.PropertyGrid('#propertygrid-basic', {
      width: '100%',
      height: 390,
      showGroup: true,
      striped: false,
      locale: localeSelect.value,
      data: createData(),
      columns: [[{
        field: 'name',
        title: 'Property',
        width: '42%',
        sortable: true
      }, {
        field: 'value',
        title: 'Value',
        width: '58%',
        formatter: function(value, row) {
          if (row.name === 'Accent color') {
            return '<span class="propertygrid-color-dot" style="background:' +
              String(value).replace(/["'<>]/g, '') +
              '"></span>' + String(value);
          }
          return value;
        }
      }]],
      groupFormatter: function(group, rows) {
        return group + ' <span class="propertygrid-group-count">(' + rows.length + ')</span>';
      },
      onSelect: function(index, row) {
        log(text('selected') + row.name);
      },
      onChange: function(index, row, newValue) {
        log(text('changedValue') + row.name + ' → ' + String(newValue));
      }
    });

    themeSelect.addEventListener('change', function() {
      THEMES.forEach(function(theme) {
        document.body.classList.remove('fg-theme-' + theme);
      });
      document.body.classList.add('fg-theme-' + themeSelect.value);
      propertyGrid.setTheme('inherit');
    });

    localeSelect.addEventListener('change', function() {
      propertyGrid.setLocale(localeSelect.value);
      syncButtons();
    });

    groupButton.addEventListener('click', function() {
      showGroup = !showGroup;
      if (showGroup) propertyGrid.showGroup();
      else propertyGrid.hideGroup();
      syncButtons();
    });

    headerButton.addEventListener('click', function() {
      showHeader = !showHeader;
      if (showHeader) propertyGrid.showHeader();
      else propertyGrid.hideHeader();
      syncButtons();
    });

    document.getElementById('propertygrid-expand').addEventListener('click', function() {
      propertyGrid.expandGroup();
    });
    document.getElementById('propertygrid-collapse').addEventListener('click', function() {
      propertyGrid.collapseGroup();
    });
    document.getElementById('propertygrid-changes').addEventListener('click', function() {
      propertyGrid.endEdit();
      log(text('changed') + propertyGrid.getChanges().length);
    });
    document.getElementById('propertygrid-accept').addEventListener('click', function() {
      propertyGrid.acceptChanges();
      log(text('accepted'));
    });
    document.getElementById('propertygrid-reject').addEventListener('click', function() {
      propertyGrid.rejectChanges();
      log(text('rejected'));
    });

    syncButtons();
  }

  global.mountFabUIPropertyGridDemo = mountPropertyGridDemo;
}(typeof window !== 'undefined' ? window : this));
