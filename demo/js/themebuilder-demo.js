(function(global) {
  'use strict';

  var THEMES = [
    { value: 'default', text: 'Default' },
    { value: 'bootstrap', text: 'Bootstrap' },
    { value: 'cupertino', text: 'Cupertino' },
    { value: 'material', text: 'Material' },
    { value: 'material-blue', text: 'Material Blue' },
    { value: 'material-teal', text: 'Material Teal' },
    { value: 'metro', text: 'Metro' },
    { value: 'metro-blue', text: 'Metro Blue' },
    { value: 'metro-gray', text: 'Metro Gray' },
    { value: 'metro-green', text: 'Metro Green' },
    { value: 'metro-orange', text: 'Metro Orange' },
    { value: 'metro-red', text: 'Metro Red' },
    { value: 'sunny', text: 'Sunny' },
    { value: 'pepper-grinder', text: 'Pepper Grinder' },
    { value: 'dark-hive', text: 'Dark Hive' },
    { value: 'black', text: 'Black' },
    { value: 'mono', text: 'Mono' },
    { value: 'mono-red', text: 'Mono Red' },
    { value: 'mono-green', text: 'Mono Green' }
  ];

  var PROPERTY_DEFINITIONS = [{
    key: 'borderColor',
    name: '邊框顏色',
    group: '共用',
    editor: 'color',
    sample: '.fui-panel',
    readVariable: '--fui-panel-border',
    fallback: '#95b8e7',
    variables: [
      '--fg-border',
      '--fg-border-strong',
      '--fui-control-border',
      '--fui-panel-border',
      '--fui-tabs-border',
      '--fui-button-border',
      '--fui-propertygrid-border',
      '--fui-propertygrid-strong-border'
    ]
  }, {
    key: 'borderRadius',
    name: '圓角',
    group: '共用',
    editor: {
      type: 'number',
      options: { min: 0, max: 24, precision: 0, suffix: ' px' }
    },
    sample: '.fui-editbox',
    readVariable: '--fui-control-radius',
    fallback: 5,
    numeric: true,
    unit: 'px',
    variables: [
      '--themebuilder-radius',
      '--fui-control-radius',
      '--fui-tabs-radius'
    ]
  }, {
    key: 'fontSize',
    name: '字體大小',
    group: '共用',
    editor: {
      type: 'number',
      options: { min: 11, max: 20, precision: 0, suffix: ' px' }
    },
    sample: '.fui-button',
    readStyle: 'fontSize',
    fallback: 14,
    numeric: true,
    unit: 'px',
    variables: ['--themebuilder-font-size']
  }, {
    key: 'headerBackground',
    name: '標題背景',
    group: '標題',
    editor: 'color',
    sample: '.fui-panel',
    readVariable: '--fui-panel-header-bg',
    fallback: '#e0ecff',
    variables: [
      '--fg-header-bg',
      '--fg-row-header-bg',
      '--fui-panel-header-bg',
      '--fui-tabs-header-bg',
      '--fui-control-trigger-bg',
      '--fui-propertygrid-header-bg',
      '--fui-propertygrid-group-bg'
    ]
  }, {
    key: 'headerText',
    name: '標題文字',
    group: '標題',
    editor: 'color',
    sample: '.fui-panel',
    readVariable: '--fui-panel-header-text',
    fallback: '#0e2d5f',
    variables: [
      '--fg-header-text',
      '--fg-row-header-text',
      '--fui-panel-header-text',
      '--fui-tabs-header-text',
      '--fui-tabs-tab-text',
      '--fui-propertygrid-header-text',
      '--fui-propertygrid-group-text'
    ]
  }, {
    key: 'bodyBackground',
    name: '內容背景',
    group: '內容',
    editor: 'color',
    sample: '.fui-panel',
    readVariable: '--fui-panel-body-bg',
    fallback: '#ffffff',
    variables: [
      '--fg-cell-bg',
      '--fui-control-bg',
      '--fui-panel-body-bg',
      '--fui-tabs-panel-bg',
      '--fui-tabs-selected-bg',
      '--fui-tabs-selected-edge',
      '--fui-propertygrid-cell-bg'
    ]
  }, {
    key: 'bodyText',
    name: '內容文字',
    group: '內容',
    editor: 'color',
    sample: '.fui-panel',
    readVariable: '--fui-panel-body-text',
    fallback: '#000000',
    variables: [
      '--fg-cell-text',
      '--fui-control-text',
      '--fui-panel-body-text',
      '--fui-tabs-panel-text',
      '--fui-tabs-selected-text',
      '--fui-tree-text',
      '--fui-propertygrid-cell-text'
    ]
  }, {
    key: 'hoverBackground',
    name: 'Hover 背景',
    group: '狀態',
    editor: 'color',
    sample: '.fui-tree',
    readVariable: '--fui-tree-hover-bg',
    fallback: '#eaf2ff',
    variables: [
      '--fg-cell-hover-bg',
      '--fg-row-hover-bg',
      '--fui-control-hover',
      '--fui-tabs-hover-bg',
      '--fui-tree-hover-bg',
      '--fui-button-bg-hover',
      '--fui-panel-tool-hover',
      '--fui-propertygrid-hover-bg'
    ]
  }, {
    key: 'hoverText',
    name: 'Hover 文字',
    group: '狀態',
    editor: 'color',
    sample: '.fui-button',
    readVariable: '--fui-button-text-hover',
    fallback: '#000000',
    variables: [
      '--fui-control-hover-text',
      '--fui-tabs-hover-text',
      '--fui-button-text-hover',
      '--fui-propertygrid-hover-text'
    ]
  }, {
    key: 'selectedBackground',
    name: '選取背景',
    group: '狀態',
    editor: 'color',
    sample: '.fui-tree',
    readVariable: '--fui-tree-selected-bg',
    fallback: '#ffe48d',
    variables: [
      '--fg-row-selected-bg',
      '--fg-selected-bg',
      '--fui-control-selected',
      '--fui-tabs-pill-bg',
      '--fui-tree-selected-bg',
      '--fui-button-bg-selected',
      '--fui-propertygrid-selected-bg'
    ]
  }, {
    key: 'selectedText',
    name: '選取文字',
    group: '狀態',
    editor: 'color',
    sample: '.fui-tree',
    readVariable: '--fui-tree-text',
    fallback: '#000000',
    variables: [
      '--fui-control-selected-text',
      '--fui-tabs-pill-text',
      '--fui-propertygrid-selected-text'
    ]
  }, {
    key: 'selectedBorder',
    name: '選取邊框',
    group: '狀態',
    editor: 'color',
    sample: '.fui-tree',
    readVariable: '--fui-tree-selected-border',
    fallback: '#ffab3f',
    variables: [
      '--fg-selected-border',
      '--fg-editor-border',
      '--fui-checkbox-accent',
      '--fui-tree-selected-border',
      '--fui-tree-checkbox-mark'
    ]
  }, {
    key: 'buttonStart',
    name: '按鈕上色',
    group: '按鈕',
    editor: 'color',
    sample: '.fui-button',
    readVariable: '--fui-button-bg-start',
    fallback: '#ffffff',
    variables: ['--fui-button-bg-start']
  }, {
    key: 'buttonEnd',
    name: '按鈕下色',
    group: '按鈕',
    editor: 'color',
    sample: '.fui-button',
    readVariable: '--fui-button-bg-end',
    fallback: '#eeeeee',
    variables: ['--fui-button-bg-end']
  }, {
    key: 'buttonText',
    name: '按鈕文字',
    group: '按鈕',
    editor: 'color',
    sample: '.fui-button',
    readVariable: '--fui-button-text',
    fallback: '#444444',
    variables: [
      '--fui-button-text',
      '--fui-control-button-text'
    ]
  }];

  var LIVE_TARGETS = [
    '#themebuilder-preview',
    '#themebuilder-preview .fg-root',
    '#themebuilder-preview .fui-button',
    '#themebuilder-preview .fui-editbox',
    '#themebuilder-preview .fui-panel',
    '#themebuilder-preview .fui-tabs',
    '#themebuilder-preview .fui-tree',
    '#themebuilder-preview .fui-calendar',
    '#themebuilder-preview .fui-menu',
    '#themebuilder-preview .fui-propertygrid'
  ];

  var EXPORT_TARGETS = [
    '.fg-theme-custom',
    '.fg-theme-custom .fg-root',
    '.fg-theme-custom .fui-button',
    '.fg-theme-custom .fui-editbox',
    '.fg-theme-custom .fui-panel',
    '.fg-theme-custom .fui-tabs',
    '.fg-theme-custom .fui-tree',
    '.fg-theme-custom .fui-calendar',
    '.fg-theme-custom .fui-menu',
    '.fg-theme-custom .fui-propertygrid'
  ];

  function element(tagName, options) {
    var node = document.createElement(tagName);
    var key;
    options = options || {};
    if (options.id) node.id = options.id;
    if (options.className) node.className = options.className;
    if (options.text != null) node.textContent = options.text;
    if (options.title) node.setAttribute('title', options.title);
    if (options.region) node.setAttribute('data-region', options.region);
    if (options.attributes) {
      for (key in options.attributes) {
        if (Object.prototype.hasOwnProperty.call(options.attributes, key)) {
          node.setAttribute(key, options.attributes[key]);
        }
      }
    }
    return node;
  }

  function append(parent, children) {
    children.forEach(function(child) {
      if (child) parent.appendChild(child);
    });
    return parent;
  }

  function createHost(id, tagName) {
    return element(tagName || 'div', { id: id });
  }

  function createButtonHost(id, text) {
    return element('a', {
      id: id,
      text: text,
      attributes: { href: 'javascript:void(0)' }
    });
  }

  function safeColor(value) {
    value = String(value == null ? '' : value).trim();
    return /^#[0-9a-f]{3,8}$/i.test(value) ||
      /^[a-z]+$/i.test(value) ||
      /^rgba?\([^<>]+\)$/i.test(value) ||
      /^hsla?\([^<>]+\)$/i.test(value) ? value : 'transparent';
  }

  function parseNumeric(value, fallback) {
    var number = parseFloat(value);
    return isFinite(number) ? number : fallback;
  }

  function createShell(app) {
    var shell = element('div', {
      id: 'themebuilder-shell',
      className: 'themebuilder-shell'
    });
    var settings = element('section', {
      id: 'themebuilder-settings',
      className: 'themebuilder-settings',
      title: 'Theme Builder',
      region: 'west'
    });
    var preview = element('section', {
      id: 'themebuilder-preview',
      className: 'themebuilder-preview fg-theme-default',
      title: 'FabUI 即時預覽',
      region: 'center'
    });
    append(shell, [settings, preview]);
    app.appendChild(shell);
    return {
      shell: shell,
      settings: settings,
      preview: preview
    };
  }

  function createSettingsHosts(settings) {
    var tabsHost = element('div', {
      id: 'themebuilder-tabs',
      className: 'themebuilder-tabs'
    });
    var settingTab = element('div', { title: '設定' });
    var settingContent = element('div', { className: 'themebuilder-tab-content' });
    var themeRow = element('div', { className: 'themebuilder-field-row' });
    var themeLabel = element('label', {
      text: '基礎主題',
      attributes: { for: 'themebuilder-base-theme' }
    });
    var themeHost = createHost('themebuilder-base-theme', 'input');
    var propertyHost = element('div', {
      id: 'themebuilder-properties',
      className: 'themebuilder-property-host'
    });
    var actions = element('div', { className: 'themebuilder-actions' });
    var reset = createButtonHost('themebuilder-reset', '還原主題');
    var copy = createButtonHost('themebuilder-copy', '複製 CSS');
    var download = createButtonHost('themebuilder-download', '下載 CSS');
    var status = element('div', {
      id: 'themebuilder-status',
      className: 'themebuilder-status',
      attributes: { 'aria-live': 'polite' }
    });
    var cssTab = element('div', { title: 'CSS' });
    var cssContent = element('div', { className: 'themebuilder-tab-content' });
    var cssOutput = element('pre', {
      id: 'themebuilder-css-output',
      className: 'themebuilder-css-output',
      attributes: { tabindex: '0', 'aria-label': '產生的 CSS' }
    });
    var cssActions = element('div', { className: 'themebuilder-actions' });
    var cssCopy = createButtonHost('themebuilder-css-copy', '複製 CSS');
    var cssDownload = createButtonHost('themebuilder-css-download', '下載 CSS');

    append(themeRow, [themeLabel, themeHost]);
    append(actions, [reset, copy, download]);
    append(settingContent, [themeRow, propertyHost, actions, status]);
    append(settingTab, [settingContent]);
    append(cssActions, [cssCopy, cssDownload]);
    append(cssContent, [cssOutput, cssActions]);
    append(cssTab, [cssContent]);
    append(tabsHost, [settingTab, cssTab]);
    settings.appendChild(tabsHost);

    return {
      tabsHost: tabsHost,
      themeHost: themeHost,
      propertyHost: propertyHost,
      reset: reset,
      copy: copy,
      download: download,
      cssCopy: cssCopy,
      cssDownload: cssDownload,
      status: status,
      cssOutput: cssOutput
    };
  }

  function createPreviewHosts(preview) {
    var toolbar = element('div', { className: 'themebuilder-preview-toolbar' });
    var add = createButtonHost('themebuilder-preview-add', '新增');
    var save = createButtonHost('themebuilder-preview-save', '儲存');
    var remove = createButtonHost('themebuilder-preview-remove', '刪除');
    var editMenuButton = createButtonHost('themebuilder-preview-edit', '編輯');
    var editMenu = element('div', {
      id: 'themebuilder-preview-edit-menu',
      attributes: { hidden: 'hidden' }
    });
    var searchHost = element('input', {
      id: 'themebuilder-preview-search',
      className: 'themebuilder-preview-search'
    });
    var previewGrid = element('div', { className: 'themebuilder-preview-grid' });
    var left = element('div', { className: 'themebuilder-preview-column' });
    var center = element('div', { className: 'themebuilder-preview-column' });
    var right = element('div', { className: 'themebuilder-preview-column' });
    var treePanel = createHost('themebuilder-tree-panel');
    var treeContent = element('div', {
      id: 'themebuilder-preview-tree',
      className: 'themebuilder-preview-tree'
    });
    var tabsHost = element('div', {
      id: 'themebuilder-preview-tabs',
      className: 'themebuilder-preview-tabs'
    });
    var gridTab = element('div', { title: '資料表' });
    var gridHost = element('div', {
      id: 'themebuilder-preview-data',
      className: 'themebuilder-grid-host'
    });
    var detailTab = element('div', { title: '摘要' });
    var detailList = element('div', { className: 'themebuilder-detail-list' });
    var formPanel = createHost('themebuilder-form-panel');
    var formContent = element('div', { className: 'themebuilder-preview-panel-content' });
    var form = element('div', { className: 'themebuilder-form' });
    var calendarHost = element('div', {
      id: 'themebuilder-preview-calendar',
      className: 'themebuilder-calendar'
    });
    var nameHost = createHost('themebuilder-preview-name', 'input');
    var statusHost = createHost('themebuilder-preview-status', 'input');
    var colorHost = createHost('themebuilder-preview-color', 'input');
    var menuItems = [
      { text: '復原', iconCls: 'icon-undo' },
      { text: '重做', iconCls: 'icon-redo' },
      { separator: true },
      { text: '剪下', iconCls: 'icon-cut' }
    ];

    menuItems.forEach(function(item) {
      var menuItem = element('div', { text: item.text || '' });
      if (item.separator) menuItem.className = 'menu-sep';
      if (item.iconCls) menuItem.setAttribute('data-options', "iconCls:'" + item.iconCls + "'");
      editMenu.appendChild(menuItem);
    });
    append(toolbar, [add, save, remove, editMenuButton, searchHost, editMenu]);
    append(treePanel, [treeContent]);
    append(left, [treePanel]);
    append(gridTab, [gridHost]);
    append(detailList, [
      element('strong', { text: '元件來源' }),
      element('span', { text: 'FabUI source-mode' }),
      element('strong', { text: '基礎主題' }),
      element('span', { id: 'themebuilder-preview-theme-name', text: 'Default' }),
      element('strong', { text: '套用方式' }),
      element('span', { text: 'CSS custom properties' }),
      element('strong', { text: '輸出' }),
      element('span', { text: '可複製或下載 CSS' })
    ]);
    append(detailTab, [detailList]);
    append(tabsHost, [gridTab, detailTab]);
    append(center, [tabsHost]);
    append(form, [
      element('label', { text: '名稱', attributes: { for: 'themebuilder-preview-name' } }),
      nameHost,
      element('label', { text: '狀態', attributes: { for: 'themebuilder-preview-status' } }),
      statusHost,
      element('label', { text: '顏色', attributes: { for: 'themebuilder-preview-color' } }),
      colorHost
    ]);
    append(formContent, [form, calendarHost]);
    append(formPanel, [formContent]);
    append(right, [formPanel]);
    append(previewGrid, [left, center, right]);
    append(preview, [toolbar, previewGrid]);

    return {
      add: add,
      save: save,
      remove: remove,
      editMenuButton: editMenuButton,
      editMenu: editMenu,
      searchHost: searchHost,
      treePanel: treePanel,
      treeContent: treeContent,
      tabsHost: tabsHost,
      gridHost: gridHost,
      formPanel: formPanel,
      nameHost: nameHost,
      statusHost: statusHost,
      colorHost: colorHost,
      calendarHost: calendarHost,
      themeName: detailList.querySelector('#themebuilder-preview-theme-name')
    };
  }

  function createPreviewControls(fabui, hosts, log) {
    var controls = [];
    var addControl = function(control) {
      controls.push(control);
      return control;
    };
    var buttons = [
      addControl(new fabui.Button(hosts.add, {
        text: '新增',
        iconCls: 'icon-add',
        onClick: function() { log('預覽操作：新增'); }
      })),
      addControl(new fabui.Button(hosts.save, {
        text: '儲存',
        iconCls: 'icon-save',
        onClick: function() { log('預覽操作：儲存'); }
      })),
      addControl(new fabui.Button(hosts.remove, {
        text: '刪除',
        iconCls: 'icon-remove',
        onClick: function() { log('預覽操作：刪除'); }
      }))
    ];
    var menuButton = addControl(new fabui.MenuButton(hosts.editMenuButton, {
      menu: hosts.editMenu,
      iconCls: 'icon-edit',
      onMenuClick: function(sender, args) {
        log('預覽選單：' + args.item.text);
      }
    }));
    var search = addControl(new fabui.EditBox(hosts.searchHost, {
      editor: 'text',
      width: '100%',
      prompt: '搜尋元件',
      clearButton: true,
      icons: [{ iconCls: 'icon-search', ariaLabel: '搜尋' }]
    }));
    var treePanel = addControl(new fabui.Panel(hosts.treePanel, {
      title: '導覽',
      iconCls: 'icon-search',
      width: '100%',
      height: '100%',
      collapsible: true
    }));
    var tree = addControl(new fabui.Tree(hosts.treeContent, {
      lines: true,
      animate: true,
      data: [{
        id: 'workspace',
        text: '工作區',
        state: 'open',
        children: [{
          id: 'customers',
          text: '客戶資料',
          iconCls: 'icon-man'
        }, {
          id: 'orders',
          text: '訂單管理',
          iconCls: 'icon-edit'
        }, {
          id: 'reports',
          text: '分析報表',
          iconCls: 'icon-excel'
        }]
      }],
      onSelect: function(node) {
        log('預覽 Tree：' + node.text);
      }
    }));
    var tabs = addControl(new fabui.Tabs(hosts.tabsHost, {
      width: '100%',
      height: '100%',
      tools: [{
        iconCls: 'icon-reload',
        title: '重新整理',
        handler: function() {
          log('預覽 Tabs：重新整理');
        }
      }]
    }));
    var grid = addControl(new fabui.FabGrid(hosts.gridHost, {
      itemsSource: [
        { id: 'A-1001', product: 'FabGrid', quantity: 12, status: '啟用' },
        { id: 'A-1002', product: 'EditBox', quantity: 8, status: '啟用' },
        { id: 'A-1003', product: 'Theme Builder', quantity: 5, status: '設計中' },
        { id: 'A-1004', product: 'PropertyGrid', quantity: 16, status: '啟用' },
        { id: 'A-1005', product: 'Tabs', quantity: 9, status: '啟用' },
        { id: 'A-1006', product: 'Tree', quantity: 7, status: '啟用' }
      ],
      columns: [
        { binding: 'id', header: '編號', width: 100 },
        { binding: 'product', header: '元件', width: 150 },
        { binding: 'quantity', header: '數量', width: 80, dataType: 'number' },
        { binding: 'status', header: '狀態', width: 100 }
      ],
      locale: 'zh-TW',
      frozenColumns: 1,
      allowFiltering: true,
      showSearchRow: false,
      selectionMode: 'CellRange'
    }));
    var formPanel = addControl(new fabui.Panel(hosts.formPanel, {
      title: '表單與日期',
      iconCls: 'icon-edit',
      width: '100%',
      height: '100%',
      collapsible: true
    }));
    var nameBox = addControl(new fabui.EditBox(hosts.nameHost, {
      editor: 'text',
      width: '100%',
      value: 'FabUI Theme',
      clearButton: true
    }));
    var statusBox = addControl(new fabui.EditBox(hosts.statusHost, {
      editor: 'combo',
      width: '100%',
      value: 'active',
      editable: false,
      data: [
        { value: 'active', text: '啟用' },
        { value: 'draft', text: '草稿' },
        { value: 'disabled', text: '停用' }
      ]
    }));
    var colorBox = addControl(new fabui.EditBox(hosts.colorHost, {
      editor: 'color',
      width: '100%',
      value: '#5375ee'
    }));
    var calendar = addControl(new fabui.Calendar(hosts.calendarHost, {
      width: 250,
      height: 250,
      locale: 'zh-TW'
    }));

    return {
      all: controls,
      buttons: buttons,
      menuButton: menuButton,
      search: search,
      treePanel: treePanel,
      tree: tree,
      tabs: tabs,
      grid: grid,
      formPanel: formPanel,
      nameBox: nameBox,
      statusBox: statusBox,
      colorBox: colorBox,
      calendar: calendar
    };
  }

  function mountThemeBuilder(fabui) {
    var required = [
      'Button', 'Calendar', 'EditBox', 'FabGrid', 'Layout',
      'MenuButton', 'Panel', 'PropertyGrid', 'Tabs', 'Tree'
    ];
    var missing = required.filter(function(name) {
      return typeof fabui[name] !== 'function';
    });
    var app = document.getElementById('themebuilder-app');
    var shell;
    var settingsHosts;
    var previewHosts;
    var builderLayout;
    var settingsTabs;
    var baseTheme;
    var propertyGrid;
    var previewControls;
    var actionButtons = [];
    var liveStyle;
    var currentTheme = 'default';

    if (missing.length) {
      throw new Error('FabUI components unavailable: ' + missing.join(', '));
    }

    shell = createShell(app);
    settingsHosts = createSettingsHosts(shell.settings);
    previewHosts = createPreviewHosts(shell.preview);
    liveStyle = element('style', { id: 'themebuilder-live-style' });
    document.head.appendChild(liveStyle);

    function log(message) {
      settingsHosts.status.textContent = message;
    }

    builderLayout = new fabui.Layout(shell.shell, {
      fit: true,
      locale: 'zh-TW',
      regions: {
        west: {
          width: 390,
          minWidth: 320,
          maxWidth: 560,
          split: true,
          collapsible: true,
          expandMode: 'dock'
        },
        center: { border: true }
      }
    });

    settingsTabs = new fabui.Tabs(settingsHosts.tabsHost, {
      fit: true,
      width: '100%',
      height: '100%'
    });

    baseTheme = new fabui.EditBox(settingsHosts.themeHost, {
      editor: 'combo',
      width: '100%',
      value: 'default',
      editable: false,
      limitToList: true,
      data: THEMES
    });

    propertyGrid = new fabui.PropertyGrid(settingsHosts.propertyHost, {
      fit: true,
      width: '100%',
      height: '100%',
      showGroup: true,
      striped: false,
      locale: 'zh-TW',
      columns: [[{
        field: 'name',
        title: '屬性',
        width: '48%'
      }, {
        field: 'value',
        title: '值',
        width: '52%',
        formatter: function(value, row) {
          if (row.editor === 'color') {
            return '<span class="themebuilder-color-swatch" style="background:' +
              safeColor(value) + '"></span>' + String(value);
          }
          return row.numeric ? String(value) + (row.unit || '') : value;
        }
      }]],
      data: [],
      onChange: function(index, row, newValue) {
        row.value = newValue;
        applyCustomTheme();
        log('已更新：' + row.name);
      }
    });

    previewControls = createPreviewControls(fabui, previewHosts, log);

    function createActionButton(host, options) {
      var button = new fabui.Button(host, options);
      actionButtons.push(button);
      return button;
    }

    function getDefinitionValue(definition) {
      var sample = shell.preview.querySelector(definition.sample);
      var styles;
      var value;
      if (!sample) return definition.fallback;
      styles = global.getComputedStyle(sample);
      value = definition.readVariable ?
        styles.getPropertyValue(definition.readVariable) :
        styles[definition.readStyle];
      value = String(value || '').trim();
      if (!value) return definition.fallback;
      return definition.numeric ? parseNumeric(value, definition.fallback) : value;
    }

    function createPropertyRows() {
      return PROPERTY_DEFINITIONS.map(function(definition) {
        return {
          key: definition.key,
          name: definition.name,
          value: getDefinitionValue(definition),
          group: definition.group,
          editor: definition.editor,
          numeric: Boolean(definition.numeric),
          unit: definition.unit || '',
          variables: definition.variables.slice()
        };
      });
    }

    function getThemeLabel(value) {
      var match = THEMES.filter(function(theme) {
        return theme.value === value;
      })[0];
      return match ? match.text : value;
    }

    function clearPreviewThemeClasses() {
      THEMES.forEach(function(theme) {
        shell.preview.classList.remove('fg-theme-' + theme.value);
        if (previewControls.grid.root) {
          previewControls.grid.root.classList.remove('fg-theme-' + theme.value);
        }
      });
    }

    function refreshPreviewTheme(theme) {
      clearPreviewThemeClasses();
      shell.preview.classList.add('fg-theme-' + theme);
      previewControls.all.forEach(function(control) {
        if (
          control === previewControls.grid ||
          control instanceof fabui.EditBox
        ) return;
        if (typeof control.setTheme === 'function') control.setTheme('inherit');
      });
      if (previewControls.grid.root) {
        previewControls.grid.root.classList.add('fg-theme-' + theme);
        previewControls.grid.refresh();
      }
      previewHosts.themeName.textContent = getThemeLabel(theme);
    }

    function formatValue(row) {
      return String(row.value) + (row.unit || '');
    }

    function createCss(selectorList) {
      var rows = propertyGrid.getRows();
      var declarations = [];
      rows.forEach(function(row) {
        row.variables.forEach(function(variable) {
          declarations.push('  ' + variable + ': ' + formatValue(row) + ';');
        });
      });
      return selectorList.join(',\n') + ' {\n' +
        declarations.join('\n') + '\n}\n\n' +
        selectorList[0] + ' .fui-button,\n' +
        selectorList[0] + ' .fui-editbox,\n' +
        selectorList[0] + ' .fui-tabs-tab {\n' +
        '  border-radius: var(--themebuilder-radius);\n' +
        '  font-size: var(--themebuilder-font-size);\n' +
        '}\n\n' +
        selectorList[0] + ' .fui-panel,\n' +
        selectorList[0] + ' .fui-tabs,\n' +
        selectorList[0] + ' .fui-tree,\n' +
        selectorList[0] + ' .fui-calendar,\n' +
        selectorList[0] + ' .fui-propertygrid,\n' +
        selectorList[0] + ' .fg-root {\n' +
        '  font-size: var(--themebuilder-font-size);\n' +
        '}\n';
    }

    function createExportCss() {
      return '/* FabUI custom theme based on "' + currentTheme +
        '". Load this file after fabui.css. */\n' +
        '/* Add fg-theme-' + currentTheme +
        ' and fg-theme-custom to the common wrapper. */\n' +
        createCss(EXPORT_TARGETS);
    }

    function applyCustomTheme() {
      liveStyle.textContent = createCss(LIVE_TARGETS);
      settingsHosts.cssOutput.textContent = createExportCss();
      if (previewControls.grid) previewControls.grid.refresh();
    }

    function loadTheme(theme) {
      currentTheme = theme || 'default';
      liveStyle.textContent = '';
      refreshPreviewTheme(currentTheme);
      global.requestAnimationFrame(function() {
        propertyGrid.loadData(createPropertyRows());
        applyCustomTheme();
        log('已載入 ' + getThemeLabel(currentTheme) + ' 主題設定');
      });
    }

    function copyCss() {
      var css = createExportCss();
      if (!global.navigator.clipboard || !global.navigator.clipboard.writeText) {
        log('瀏覽器未提供 Clipboard API，請從 CSS 頁籤手動複製');
        settingsTabs.select('CSS');
        return;
      }
      global.navigator.clipboard.writeText(css).then(function() {
        log('CSS 已複製到剪貼簿');
      }).catch(function() {
        log('無法寫入剪貼簿，請從 CSS 頁籤手動複製');
        settingsTabs.select('CSS');
      });
    }

    function downloadCss() {
      var blob = new Blob([createExportCss()], { type: 'text/css;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = element('a', {
        attributes: {
          href: url,
          download: 'fabui.theme.custom.css'
        }
      });
      document.body.appendChild(link);
      link.click();
      link.remove();
      global.setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 0);
      log('已下載 fabui.theme.custom.css');
    }

    createActionButton(settingsHosts.reset, {
      text: '還原主題',
      iconCls: 'icon-reload',
      onClick: function() {
        loadTheme(currentTheme);
      }
    });
    createActionButton(settingsHosts.copy, {
      text: '複製 CSS',
      iconCls: 'icon-copy',
      onClick: copyCss
    });
    createActionButton(settingsHosts.download, {
      text: '下載 CSS',
      iconCls: 'icon-save',
      onClick: downloadCss
    });
    createActionButton(settingsHosts.cssCopy, {
      text: '複製 CSS',
      iconCls: 'icon-copy',
      onClick: copyCss
    });
    createActionButton(settingsHosts.cssDownload, {
      text: '下載 CSS',
      iconCls: 'icon-save',
      onClick: downloadCss
    });

    baseTheme.on('change', function(event) {
      loadTheme(event && event.value ? event.value : baseTheme.getValue());
    });

    global.addEventListener('resize', function() {
      builderLayout.resize();
      propertyGrid.resize();
      previewControls.tabs.resize();
      previewControls.grid.invalidate();
    });

    loadTheme('default');

    global.fabThemeBuilderDemo = {
      layout: builderLayout,
      settingsTabs: settingsTabs,
      baseTheme: baseTheme,
      propertyGrid: propertyGrid,
      preview: previewControls,
      apply: applyCustomTheme,
      reset: function() { loadTheme(currentTheme); },
      getCss: createExportCss
    };
  }

  global.mountFabUIThemeBuilder = mountThemeBuilder;
}(typeof window !== 'undefined' ? window : this));
