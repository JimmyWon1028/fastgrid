var WIN7_THEMES = [
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
var WIN7_THEME_STORAGE_KEY = 'fabui.win7.theme';

function normalizeWin7Theme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  var index;
  for (index = 0; index < WIN7_THEMES.length; index += 1) {
    if (WIN7_THEMES[index].value === theme) return theme;
  }
  return 'default';
}

function getWin7ThemeStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch (error) {
    return null;
  }
}

function readWin7Theme(storage) {
  if (!storage || typeof storage.getItem !== 'function') return 'default';
  try {
    return normalizeWin7Theme(storage.getItem(WIN7_THEME_STORAGE_KEY));
  } catch (error) {
    return 'default';
  }
}

function writeWin7Theme(storage, value) {
  var theme = normalizeWin7Theme(value);
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(WIN7_THEME_STORAGE_KEY, theme);
    return true;
  } catch (error) {
    return false;
  }
}

function requireFabUI(fabui) {
  [
    'Button',
    'Chart',
    'FabGrid',
    'Layout',
    'Menu',
    'Tabs',
    'Tree',
    'Window'
  ].forEach(function(name) {
    if (typeof fabui[name] !== 'function') {
      throw new Error('fabui.' + name + ' class is unavailable.');
    }
  });
}

function createRows() {
  return [
    { item: 'BST-1', product: 'FI-SW-01', price: 36.5, stock: 10, attribute: 'Large', status: 'P' },
    { item: 'BST-10', product: 'K9-DL-01', price: 18.5, stock: 12, attribute: 'Spotted Adult Female', status: 'P' },
    { item: 'BST-11', product: 'RP-SN-01', price: 38.5, stock: 12, attribute: 'Venomless', status: 'P' },
    { item: 'BST-12', product: 'RP-SN-01', price: 26.5, stock: 12, attribute: 'Rattleless', status: 'P' },
    { item: 'BST-13', product: 'RP-LL-02', price: 35.5, stock: 12, attribute: 'Green Adult', status: 'P' },
    { item: 'BST-14', product: 'FL-DSH-01', price: 158.5, stock: 12, attribute: 'Tailless', status: 'P' },
    { item: 'BST-15', product: 'FL-DSH-01', price: 83.5, stock: 12, attribute: 'With tail', status: 'P' },
    { item: 'BST-16', product: 'FL-DLH-02', price: 23.5, stock: 12, attribute: 'Adult Female', status: 'P' }
  ];
}

function createNetworkRows() {
  return [
    { device: 'OFFICE-PC', type: 'Computer', address: '192.168.1.12', status: 'Online' },
    { device: 'NAS-STORAGE', type: 'Storage', address: '192.168.1.20', status: 'Online' },
    { device: 'MEETING-TV', type: 'Display', address: '192.168.1.35', status: 'Standby' },
    { device: 'LASER-PRINTER', type: 'Printer', address: '192.168.1.42', status: 'Online' },
    { device: 'GUEST-LAPTOP', type: 'Computer', address: '192.168.1.58', status: 'Limited' }
  ];
}

function createMonitorRows() {
  return [
    { time: '10:00', cpu: 28, memory: 48, disk: 18 },
    { time: '10:05', cpu: 35, memory: 51, disk: 22 },
    { time: '10:10', cpu: 64, memory: 58, disk: 35 },
    { time: '10:15', cpu: 46, memory: 61, disk: 28 },
    { time: '10:20', cpu: 72, memory: 66, disk: 44 },
    { time: '10:25', cpu: 53, memory: 63, disk: 31 }
  ];
}

function makeShortcutDraggable(shortcut, desktop) {
  var drag = null;

  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    shortcut.classList.remove('win7-shortcut-dragging');
    if (shortcut.hasPointerCapture(event.pointerId)) {
      shortcut.releasePointerCapture(event.pointerId);
    }
    drag = null;
  }

  shortcut.addEventListener('pointerdown', function(event) {
    var shortcutRect;
    var desktopRect;
    if (event.button !== 0) return;
    event.preventDefault();
    shortcutRect = shortcut.getBoundingClientRect();
    desktopRect = desktop.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: shortcutRect.left - desktopRect.left,
      top: shortcutRect.top - desktopRect.top
    };
    shortcut.__win7Dragged = false;
    shortcut.setPointerCapture(event.pointerId);
  });

  shortcut.addEventListener('pointermove', function(event) {
    var desktopRect;
    var left;
    var top;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (
      !shortcut.__win7Dragged &&
      Math.abs(event.clientX - drag.startX) < 4 &&
      Math.abs(event.clientY - drag.startY) < 4
    ) return;
    shortcut.__win7Dragged = true;
    shortcut.classList.add('win7-shortcut-dragging');
    desktopRect = desktop.getBoundingClientRect();
    left = Math.max(
      0,
      Math.min(
        drag.left + event.clientX - drag.startX,
        desktopRect.width - shortcut.offsetWidth
      )
    );
    top = Math.max(
      0,
      Math.min(
        drag.top + event.clientY - drag.startY,
        desktopRect.height - 44 - shortcut.offsetHeight
      )
    );
    shortcut.style.left = Math.round(left) + 'px';
    shortcut.style.top = Math.round(top) + 'px';
  });

  shortcut.addEventListener('pointerup', finishDrag);
  shortcut.addEventListener('pointercancel', finishDrag);
}

function mountWin7Demo(fabui) {
  var windows = {};
  var refreshers = {};
  var layout;
  var tree;
  var tabs;
  var grid;
  var networkGrid;
  var monitorChart;
  var buttons = [];
  var clockTimer;
  var minimizeHideTimers = {};
  var desktop = document.querySelector('.win7-desktop');
  var desktopMenu;
  var startButton;
  var startElement = document.getElementById('win7-start');
  var startMenu;
  var themeControls = [];
  var themeStorage = getWin7ThemeStorage();
  var taskElements = {
    computer: document.getElementById('win7-task-computer'),
    network: document.getElementById('win7-task-network'),
    monitor: document.getElementById('win7-task-monitor')
  };

  requireFabUI(fabui);

  function refreshComputer() {
    window.requestAnimationFrame(function() {
      if (layout) layout.resize();
      if (tabs) tabs.resize('100%', '100%');
      if (grid) grid.refresh();
    });
  }

  function refreshNetwork() {
    window.requestAnimationFrame(function() {
      if (networkGrid) networkGrid.refresh();
    });
  }

  function refreshMonitor() {
    window.requestAnimationFrame(function() {
      if (monitorChart) monitorChart.resize();
    });
  }

  refreshers.computer = refreshComputer;
  refreshers.network = refreshNetwork;
  refreshers.monitor = refreshMonitor;

  function showWindow(name) {
    var control = windows[name];
    var wasClosed;
    if (!control) return;
    wasClosed = control.options.closed;
    if (control.options.minimized) {
      control.windowElement.hidden = false;
      control.restore();
    } else {
      control.open();
    }
    if (wasClosed) control.center();
    taskElements[name].hidden = true;
    control.bringToFront();
    refreshers[name]();
  }

  function showComputer(tabTitle) {
    showWindow('computer');
    if (tabTitle) tabs.select(tabTitle);
    refreshComputer();
  }

  function clearMinimizeHideTimer(name) {
    if (minimizeHideTimers[name] == null) return;
    window.clearTimeout(minimizeHideTimers[name]);
    minimizeHideTimers[name] = null;
  }

  function getMinimizeAnimationDelay(control) {
    var duration;
    if (!control || control.options.animate === false) return 0;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return 0;
    duration = Number(control.options.animationDuration);
    return isFinite(duration) && duration > 0 ? duration + 50 : 0;
  }

  function minimizeToTaskbar(name) {
    var control = windows[name];
    var delay = getMinimizeAnimationDelay(control);
    clearMinimizeHideTimer(name);
    taskElements[name].hidden = false;
    if (!delay) {
      control.windowElement.hidden = true;
      return;
    }
    minimizeHideTimers[name] = window.setTimeout(function() {
      minimizeHideTimers[name] = null;
      if (control.options.minimized && !control.options.closed) {
        control.windowElement.hidden = true;
      }
    }, delay);
  }

  function restoreFromTaskbar(name) {
    clearMinimizeHideTimer(name);
    windows[name].windowElement.hidden = false;
    taskElements[name].hidden = true;
    refreshers[name]();
  }

  function closeWindow(name) {
    clearMinimizeHideTimer(name);
    taskElements[name].hidden = true;
  }

  function revealTaskbarTarget(name) {
    taskElements[name].hidden = false;
    return taskElements[name];
  }

  function applyTheme(theme, persist) {
    theme = normalizeWin7Theme(theme);
    WIN7_THEMES.forEach(function(item) {
      document.body.classList.remove('fg-theme-' + item.value);
    });
    document.body.classList.add('fg-theme-' + theme);
    themeControls.forEach(function(control) {
      if (control && typeof control.setTheme === 'function') {
        control.setTheme('inherit');
      }
    });
    WIN7_THEMES.forEach(function(item) {
      var menuItem = desktopMenu.findItem({ name: 'theme-' + item.value });
      if (!menuItem) return;
      desktopMenu.setIcon({
        target: menuItem.target,
        iconCls: item.value === theme ? 'icon-ok' : ''
      });
    });
    if (persist !== false) writeWin7Theme(themeStorage, theme);
  }

  function showDesktopThemeMenu(left, top) {
    startMenu.hide();
    desktopMenu.show({
      left: left,
      top: top
    });
  }

  function updateClock() {
    document.getElementById('win7-clock').textContent =
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date());
  }

  windows.computer = new fabui.Window('#win7-computer-window', {
    title: 'Computer',
    iconCls: 'icon-window',
    width: Math.min(780, Math.max(360, window.innerWidth - 150)),
    height: Math.min(480, Math.max(300, window.innerHeight - 100)),
    locale: 'zh-TW',
    collapsible: false,
    minimizable: true,
    minimizeTarget: function() {
      return revealTaskbarTarget('computer');
    },
    maximizable: true,
    closable: true,
    constrain: true,
    closed: true,
    onOpen: refreshComputer,
    onResize: refreshComputer,
    onMaximize: refreshComputer,
    onMinimize: function() {
      minimizeToTaskbar('computer');
    },
    onRestore: function() {
      restoreFromTaskbar('computer');
    },
    onClose: function() {
      closeWindow('computer');
    }
  });

  windows.network = new fabui.Window('#win7-network-window', {
    title: 'Network',
    iconCls: 'icon-search',
    width: Math.min(680, Math.max(360, window.innerWidth - 240)),
    height: Math.min(410, Math.max(300, window.innerHeight - 160)),
    locale: 'zh-TW',
    collapsible: false,
    minimizable: true,
    minimizeTarget: function() {
      return revealTaskbarTarget('network');
    },
    maximizable: true,
    closable: true,
    constrain: true,
    closed: true,
    onOpen: refreshNetwork,
    onResize: refreshNetwork,
    onMaximize: refreshNetwork,
    onMinimize: function() {
      minimizeToTaskbar('network');
    },
    onRestore: function() {
      restoreFromTaskbar('network');
    },
    onClose: function() {
      closeWindow('network');
    }
  });

  windows.monitor = new fabui.Window('#win7-monitor-window', {
    title: 'System Monitor',
    iconCls: 'icon-help',
    width: Math.min(700, Math.max(360, window.innerWidth - 220)),
    height: Math.min(440, Math.max(300, window.innerHeight - 140)),
    locale: 'zh-TW',
    collapsible: false,
    minimizable: true,
    minimizeTarget: function() {
      return revealTaskbarTarget('monitor');
    },
    maximizable: true,
    closable: true,
    constrain: true,
    closed: true,
    onOpen: refreshMonitor,
    onResize: refreshMonitor,
    onMaximize: refreshMonitor,
    onMinimize: function() {
      minimizeToTaskbar('monitor');
    },
    onRestore: function() {
      restoreFromTaskbar('monitor');
    },
    onClose: function() {
      closeWindow('monitor');
    }
  });

  layout = new fabui.Layout('#win7-layout', {
    fit: true,
    locale: 'zh-TW',
    regions: {
      west: {
        width: 178,
        split: true,
        collapsible: true,
        expandMode: 'dock'
      },
      center: {
        border: true
      }
    }
  });

  tree = new fabui.Tree('#win7-tree', {
    locale: 'zh-TW',
    lines: true,
    animate: true,
    data: [
      {
        id: 'computer',
        text: 'Computer',
        iconCls: 'icon-window',
        state: 'open',
        children: [
          { id: 'datagrid', text: 'DataGrid', iconCls: 'icon-table' },
          { id: 'documents', text: 'Documents', iconCls: 'icon-folder' }
        ]
      },
      { id: 'network', text: 'Network', iconCls: 'icon-search' },
      { id: 'monitor', text: 'Monitor', iconCls: 'icon-help' }
    ],
    onSelect: function(node) {
      tabs.select(node.id === 'datagrid' ? 'DataGrid' : 'About');
      refreshComputer();
    }
  });

  tabs = new fabui.Tabs('#win7-tabs', {
    fit: true,
    border: false,
    selected: 1,
    locale: 'zh-TW'
  });

  grid = new fabui.FabGrid('#win7-grid', {
    itemsSource: createRows(),
    columns: [
      { binding: 'item', header: 'Item ID', width: 74 },
      { binding: 'product', header: 'Product ID', width: 92 },
      { binding: 'price', header: 'List Price', width: 72, align: 'right' },
      { binding: 'stock', header: 'Unit Cost', width: 70, align: 'right' },
      { binding: 'attribute', header: 'Attribute', width: 142 },
      { binding: 'status', header: 'Status', width: 54, align: 'center' }
    ],
    locale: 'zh-TW',
    allowEditing: false,
    filterMode: false,
    showColumnChooser: false,
    showRowHeaders: false,
    selectionMode: 'Cell'
  });

  networkGrid = new fabui.FabGrid('#win7-network-grid', {
    itemsSource: createNetworkRows(),
    columns: [
      { binding: 'device', header: '裝置名稱', width: 150 },
      { binding: 'type', header: '類型', width: 110 },
      { binding: 'address', header: 'IP 位址', width: 130 },
      { binding: 'status', header: '狀態', width: 100 }
    ],
    locale: 'zh-TW',
    allowEditing: false,
    filterMode: false,
    showColumnChooser: false,
    showRowHeaders: false,
    selectionMode: 'Cell'
  });

  monitorChart = new fabui.Chart('#win7-monitor-chart', {
    chartType: 'Line',
    itemsSource: createMonitorRows(),
    bindingX: 'time',
    series: [
      { name: 'CPU', binding: 'cpu' },
      { name: 'Memory', binding: 'memory' },
      { name: 'Disk', binding: 'disk' }
    ],
    axisY: { min: 0, max: 100 },
    legend: { position: 'Bottom' },
    tooltip: { content: '{seriesName} · {x}: {y}%' },
    selectionMode: 'Point',
    locale: 'zh-TW',
    theme: 'inherit'
  });

  startButton = new fabui.Button(startElement, {
    iconCls: 'icon-windows',
    toggle: true,
    theme: 'inherit'
  });
  buttons.push(startButton);
  [
    { name: 'computer', iconCls: 'icon-window' },
    { name: 'network', iconCls: 'icon-search' },
    { name: 'monitor', iconCls: 'icon-help' }
  ].forEach(function(item) {
    var button = new fabui.Button(taskElements[item.name], {
      iconCls: item.iconCls,
      theme: 'inherit'
    });
    buttons.push(button);
    taskElements[item.name].addEventListener('click', function() {
      if (item.name === 'computer') showComputer('DataGrid');
      else showWindow(item.name);
    });
  });

  startMenu = new fabui.Menu('#win7-start-menu', {
    locale: 'zh-TW',
    minWidth: 270,
    hideOnUnhover: false,
    items: [
      {
        name: 'computer',
        text: 'Computer',
        iconCls: 'icon-window',
        onclick: function() {
          showComputer('DataGrid');
        }
      },
      {
        name: 'documents',
        text: 'Documents',
        iconCls: 'icon-folder',
        onclick: function() {
          showComputer('About');
        }
      },
      {
        name: 'network',
        text: 'Network',
        iconCls: 'icon-search',
        onclick: function() {
          showWindow('network');
        }
      },
      {
        name: 'monitor',
        text: 'System Monitor',
        iconCls: 'icon-help',
        onclick: function() {
          showWindow('monitor');
        }
      },
      { separator: true },
      {
        name: 'programs',
        text: '所有程式',
        iconCls: 'icon-table',
        children: [
          { name: 'grid', text: 'FabGrid', iconCls: 'icon-table' },
          { name: 'settings', text: '系統設定', iconCls: 'icon-edit' }
        ]
      },
      { name: 'help', text: '說明及支援', iconCls: 'icon-help' },
      { separator: true },
      {
        name: 'shutdown',
        text: '關機',
        iconCls: 'icon-exit',
        onclick: function() {
          Object.keys(windows).forEach(function(name) {
            windows[name].close();
          });
        }
      }
    ],
    onShow: function() {
      startButton.select(true);
    },
    onHide: function() {
      startButton.unselect(true);
    }
  });

  desktopMenu = new fabui.Menu('#win7-desktop-menu', {
    locale: 'zh-TW',
    minWidth: 210,
    hideOnUnhover: false,
    items: WIN7_THEMES.map(function(theme) {
      return {
        name: 'theme-' + theme.value,
        text: theme.text,
        iconCls: theme.value === 'default' ? 'icon-ok' : '',
        onclick: function() {
          applyTheme(theme.value);
        }
      };
    })
  });

  themeControls = Object.keys(windows).map(function(name) {
    return windows[name];
  }).concat([
    layout,
    tree,
    tabs,
    monitorChart,
    startMenu,
    desktopMenu
  ], buttons);
  applyTheme(readWin7Theme(themeStorage), false);

  startElement.addEventListener('click', function() {
    var menuRect;
    var rect = startElement.getBoundingClientRect();
    var left = rect.left + window.pageXOffset;
    if (!startMenu.hostElement.hidden) {
      startMenu.hide();
      return;
    }
    startMenu.show({
      left: left,
      top: rect.top + window.pageYOffset
    });
    menuRect = startMenu.hostElement.getBoundingClientRect();
    startMenu.show({
      left: left,
      top: rect.top + window.pageYOffset - menuRect.height - 4
    });
  });
  desktop.addEventListener('contextmenu', function(event) {
    if (
      event.target.closest(
        '.fui-window, .fui-menu, .win7-shortcut, .win7-taskbar'
      )
    ) return;
    event.preventDefault();
    showDesktopThemeMenu(event.pageX, event.pageY);
  });
  desktop.addEventListener('keydown', function(event) {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) {
      return;
    }
    event.preventDefault();
    showDesktopThemeMenu(12, 12);
  });
  Array.prototype.forEach.call(
    document.querySelectorAll('[data-win7-action]'),
    function(shortcut) {
      makeShortcutDraggable(shortcut, desktop);
      shortcut.addEventListener('click', function(event) {
        event.preventDefault();
        if (shortcut.__win7Dragged) {
          shortcut.__win7Dragged = false;
          return;
        }
        if (shortcut.getAttribute('data-win7-action') === 'computer') {
          showComputer('DataGrid');
        } else {
          showWindow(shortcut.getAttribute('data-win7-action'));
        }
      });
    }
  );

  window.addEventListener('resize', function() {
    Object.keys(windows).forEach(function(name) {
      if (!windows[name].options.closed && !windows[name].options.minimized) {
        refreshers[name]();
      }
    });
  });
  updateClock();
  clockTimer = window.setInterval(updateClock, 1000);
  showComputer('DataGrid');

  window.fabWin7Demo = {
    buttons: buttons,
    clockTimer: clockTimer,
    grid: grid,
    layout: layout,
    monitorChart: monitorChart,
    networkGrid: networkGrid,
    desktopMenu: desktopMenu,
    startMenu: startMenu,
    tabs: tabs,
    tree: tree,
    window: windows.computer,
    windows: windows
  };
}

export {
  mountWin7Demo,
  normalizeWin7Theme,
  readWin7Theme,
  writeWin7Theme
};
