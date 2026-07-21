(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function createData() {
    return [{
      id: 'documents',
      text: '我的文件',
      state: 'open',
      children: [{
        id: 'photos',
        text: '相片',
        state: 'closed',
        children: [
          { id: 'friends', text: '朋友' },
          { id: 'family', text: '家人' },
          { id: 'company', text: '公司' }
        ]
      }, {
        id: 'programs',
        text: '應用程式',
        state: 'open',
        children: [
          { id: 'fabgrid', text: 'FabGrid' },
          { id: 'browser', text: 'Browser' },
          { id: 'office', text: 'Office' }
        ]
      }, {
        id: 'index',
        text: 'index.html',
        iconCls: 'icon-search'
      }, {
        id: 'about',
        text: 'about.html'
      }]
    }];
  }

  function createCheckboxData() {
    return [{
      id: 'project',
      text: '網站專案',
      state: 'open',
      children: [{
        id: 'src',
        text: 'src',
        checked: true,
        children: [
          { id: 'components', text: 'components.js', checked: true },
          { id: 'styles', text: 'styles.css', checked: true }
        ]
      }, {
        id: 'demo',
        text: 'demo',
        children: [
          { id: 'tree-demo', text: 'tree.html' },
          { id: 'grid-demo', text: 'grid.html' }
        ]
      }, {
        id: 'readme',
        text: 'README.md'
      }]
    }];
  }

  function mountTreeDemo(fabui) {
    var themeSelect = document.getElementById('tree-theme');
    var localeSelect = document.getElementById('tree-locale');
    var searchInput = document.getElementById('tree-search');
    var status = document.getElementById('tree-status');
    var contextMenu = document.getElementById('tree-context-menu');
    var contextTree = null;
    var contextNode = null;
    var basicTree;
    var checkboxTree;
    var actionTree;
    var lazyTree;
    var menu;

    function log(message) {
      status.textContent = message;
    }

    function setContext(tree, event, node) {
      contextTree = tree;
      contextNode = node;
      tree.select(node);
      event.preventDefault();
      menu.show({ left: event.clientX, top: event.clientY });
    }

    if (!fabui || typeof fabui.Tree !== 'function') {
      throw new Error('fabui.Tree class is unavailable.');
    }

    basicTree = new fabui.Tree('#tree-basic', {
      animate: true,
      locale: localeSelect.value,
      onSelect: function(node) {
        log('選取：' + node.text);
      }
    });

    checkboxTree = new fabui.Tree('#tree-checkbox', {
      data: createCheckboxData(),
      checkbox: true,
      cascadeCheck: true,
      lines: true,
      locale: localeSelect.value,
      onCheck: function(node, checked) {
        log((checked ? '勾選：' : '取消勾選：') + node.text);
      }
    });

    actionTree = new fabui.Tree('#tree-actions', {
      data: createData(),
      animate: true,
      lines: true,
      dnd: true,
      locale: localeSelect.value,
      formatter: function(node) {
        if (node.id === 'documents') return '<strong>' + node.text + '</strong>';
        return node.text;
      },
      onContextMenu: function(event, node) {
        setContext(actionTree, event, node);
      },
      onDrop: function(target, source, point) {
        log('移動：' + source.text + ' → ' + target.text + '（' + point + '）');
      },
      onAfterEdit: function(node) {
        log('已重新命名：' + node.text);
      }
    });

    lazyTree = new fabui.Tree('#tree-lazy', {
      data: [{
        id: 'server',
        text: '伺服器資料',
        state: 'closed'
      }],
      animate: true,
      locale: localeSelect.value,
      loader: function(param) {
        return new Promise(function(resolve) {
          global.setTimeout(function() {
            resolve([
              { id: param.id + '-orders', text: '訂單資料' },
              { id: param.id + '-customers', text: '客戶資料' },
              {
                id: param.id + '-archive',
                text: '封存',
                state: 'closed',
                children: [
                  { id: param.id + '-2025', text: '2025' },
                  { id: param.id + '-2026', text: '2026' }
                ]
              }
            ]);
          }, 350);
        });
      },
      onLoadSuccess: function(node) {
        log('非同步載入完成：' + (node ? node.text : '根節點'));
      }
    });

    menu = new fabui.Menu(contextMenu, {
      locale: localeSelect.value,
      items: [{
        text: '新增子節點',
        iconCls: 'icon-add',
        handler: function() {
          if (!contextTree || !contextNode) return;
          contextTree.append({
            parent: contextNode,
            data: [{ text: '新節點 ' + Date.now().toString().slice(-4) }]
          });
          log('已新增子節點');
        }
      }, {
        text: '重新命名',
        iconCls: 'icon-edit',
        handler: function() {
          if (contextTree && contextNode) contextTree.beginEdit(contextNode);
        }
      }, {
        separator: true
      }, {
        text: '刪除',
        iconCls: 'icon-remove',
        handler: function() {
          if (!contextTree || !contextNode) return;
          log('已刪除：' + contextNode.text);
          contextTree.remove(contextNode);
          contextNode = null;
        }
      }]
    });

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      [basicTree, checkboxTree, actionTree, lazyTree, menu].forEach(function(control) {
        control.setTheme('inherit');
      });
      log('主題：' + theme);
    }

    function applyLocale(locale) {
      [basicTree, checkboxTree, actionTree, lazyTree, menu].forEach(function(control) {
        control.setLocale(locale);
      });
      log('語系：' + locale);
    }

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
    });
    localeSelect.addEventListener('change', function() {
      applyLocale(localeSelect.value);
    });
    searchInput.addEventListener('input', function() {
      actionTree.doFilter(searchInput.value);
    });
    document.getElementById('tree-expand-all').addEventListener('click', function() {
      actionTree.expandAll();
      log('已全部展開');
    });
    document.getElementById('tree-collapse-all').addEventListener('click', function() {
      actionTree.collapseAll();
      log('已全部收合');
    });
    document.getElementById('tree-add').addEventListener('click', function() {
      var selected = actionTree.getSelected() || actionTree.getRoot();
      actionTree.append({
        parent: selected,
        data: [{ text: '新增節點 ' + Date.now().toString().slice(-4) }]
      });
      log('已在「' + selected.text + '」新增子節點');
    });
    document.getElementById('tree-edit').addEventListener('click', function() {
      var selected = actionTree.getSelected();
      if (selected) actionTree.beginEdit(selected);
      else log('請先選取節點');
    });
    document.getElementById('tree-remove').addEventListener('click', function() {
      var selected = actionTree.getSelected();
      if (!selected) {
        log('請先選取節點');
        return;
      }
      log('已刪除：' + selected.text);
      actionTree.remove(selected);
    });

    applyTheme(themeSelect.value);
    global.fabTreeDemo = {
      basicTree: basicTree,
      checkboxTree: checkboxTree,
      actionTree: actionTree,
      lazyTree: lazyTree,
      menu: menu
    };
    log('Tree Demo 已就緒，可用滑鼠或鍵盤操作節點');
  }

  global.mountFabUITreeDemo = mountTreeDemo;
}(typeof window !== 'undefined' ? window : this));
