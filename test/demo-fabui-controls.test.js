import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { bridgeNumberEditBoxInput } from '../demo/js/grid2-components.js?v=20260720-number-input-bridge-v1';
import {
  normalizeWin7Theme,
  readWin7Theme,
  writeWin7Theme
} from '../demo/js/win7-demo.js?v=20260720-win7-theme-storage-v1';

var demoDirectory = new URL('../demo/', import.meta.url);
var devHelperScript = readFileSync(
  new URL('../demo/js/dev-controls.js', import.meta.url),
  'utf8'
);
var distHelperScript = readFileSync(
  new URL('../demo/js/dist-controls.js', import.meta.url),
  'utf8'
);
var helperScript = readFileSync(
  new URL('../demo/js/demo-controls.js', import.meta.url),
  'utf8'
);
var diagramHtml = readFileSync(
  new URL('../demo/dev-diagram.html', import.meta.url),
  'utf8'
);
var buildDiagramHtml = readFileSync(
  new URL('../demo/diagram.html', import.meta.url),
  'utf8'
);
var diagramScript = readFileSync(
  new URL('../src/diagram/diagram.js', import.meta.url),
  'utf8'
);
var win7Html = readFileSync(
  new URL('../demo/dev-win7.html', import.meta.url),
  'utf8'
);
var win7Script = readFileSync(
  new URL('../demo/js/win7-demo.js', import.meta.url),
  'utf8'
);

function getBuildPages() {
  return readdirSync(demoDirectory)
    .filter(function(name) {
      return /\.html$/.test(name) &&
        !/^dev/.test(name) &&
        name !== 'index.html' &&
        !/vue2/.test(name);
    });
}

function readAttribute(source, name) {
  var match = source.match(new RegExp('\\b' + name + '="([^"]*)"'));
  return match ? match[1] : '';
}

function normalizeShowcaseText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/開發版|正式版|Build Demo|Build|Source-mode：|Build-mode：/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readShowcaseSignature(html) {
  var bodyMatch = html.match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);
  var bodyAttributes = bodyMatch ? bodyMatch[1] : '';
  var body = bodyMatch ? bodyMatch[2] : '';
  var markup = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  var ids = Array.from(markup.matchAll(/\bid="([^"]+)"/g))
    .map(function(match) {
      return match[1];
    });
  var inputs = Array.from(markup.matchAll(/<input\b([^>]*)>/gi))
    .map(function(match) {
      return {
        id: readAttribute(match[1], 'id'),
        type: readAttribute(match[1], 'type') || 'text',
        checked: /\bchecked(?:\s|>|$)/.test(match[1])
      };
    });
  var selects = Array.from(
    markup.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)
  ).map(function(match) {
    return {
      id: readAttribute(match[1], 'id'),
      options: Array.from(match[2].matchAll(/<option\b([^>]*)>/gi))
        .map(function(optionMatch) {
          return {
            value: readAttribute(optionMatch[1], 'value'),
            selected: /\bselected(?:\s|>|$)/.test(optionMatch[1])
          };
        })
    };
  });
  var textBlocks = Array.from(
    markup.matchAll(/<(h[1-3]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi)
  ).map(function(match) {
    return normalizeShowcaseText(match[2]);
  }).filter(Boolean);

  return {
    toolbarIconOnly: readAttribute(
      bodyAttributes,
      'data-grid-toolbar-icon-only'
    ),
    ids: ids,
    inputs: inputs,
    selects: selects,
    textBlocks: textBlocks
  };
}

function readShowcasePairs() {
  var devIndex = readFileSync(new URL('dev.html', demoDirectory), 'utf8');

  return Array.from(devIndex.matchAll(
    /<tr><td>(.*?)<\/td><td><a href="\.\/(dev-[^"]+)">.*?<\/a><\/td><td><a href="\.\/([^"]+)">.*?<\/a><\/td><\/tr>/g
  )).map(function(match) {
    return {
      label: match[1],
      dev: match[2],
      build: match[3]
    };
  });
}

test('Every static Demo theme selector offers the Mono theme', function() {
  var pages = readdirSync(demoDirectory)
    .filter(function(name) {
      return /\.html$/.test(name);
    });
  var matched = 0;

  pages.forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    if (!/<option value=["']black["']/.test(html)) {
      return;
    }
    matched += 1;
    assert.match(html, /<option value=["']mono["'][^>]*>Mono<\/option>/i, name);
  });

  assert.ok(matched > 0);
  assert.match(
    readFileSync(new URL('../demo/js/grid.js', import.meta.url), 'utf8'),
    /value:\s*["']mono["'],\s*label:\s*["']Mono["']/
  );
  assert.match(
    readFileSync(new URL('../demo/js/themebuilder-demo.js', import.meta.url), 'utf8'),
    /value:\s*["']mono["'],\s*text:\s*["']Mono["']/
  );
});

test('Every source-mode Demo loads the shared FabUI control enhancer', function() {
  var pages = readdirSync(demoDirectory)
    .filter(function(name) {
      return /^dev-.*\.html$/.test(name);
    });

  assert.ok(pages.length > 0);
  pages.forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.match(
      html,
      /<script type="module" src="\.\/js\/dev-controls\.js\?v=20260721-initial-filter-rules-v1"><\/script>/,
      name
    );
  });
});

test('The shared enhancer uses FabUI controls for native Demo fields', function() {
  assert.match(devHelperScript, /from '\.\.\/\.\.\/src\/fabui\.js/);
  assert.match(distHelperScript, /mountFabUIDemoControls\(window\.fabui,/);
  assert.match(helperScript, /new fabui\.Button\(button,/);
  assert.match(helperScript, /a\[data-fabui-button\]/);
  assert.match(helperScript, /a\[href="javascript:void\(0\)"\]/);
  assert.match(helperScript, /new fabui\.EditBox\(select,/);
  assert.match(helperScript, /new fabui\.EditBox\(input,/);
  assert.match(helperScript, /new fabui\.CheckBox\(input,/);
  assert.match(helperScript, /new fabui\.RadioButton\(input,/);
  assert.match(helperScript, /new fabui\.FileBox\(input,/);
  assert.match(
    helperScript,
    /iconCls:\s*button\.getAttribute\('data-icon-cls'\)\s*\|\|\s*''/
  );
  assert.match(helperScript, /theme:\s*'inherit'/);
  assert.match(helperScript, /\.fui-combobox-panel/);
  assert.match(helperScript, /\.fui-colorbox-panel/);
  assert.match(helperScript, /\.fui-datebox-panel/);
});

test('The shared enhancer leaves hidden Diagram file inputs untouched', function() {
  assert.match(
    helperScript,
    /function mountFileBox\(input\) \{[\s\S]*?if \(input\.hidden \|\|/
  );
  assert.match(diagramScript, /jsonFileInput\.hidden = true/);
  assert.match(
    diagramHtml,
    /dev-controls\.js\?v=20260721-initial-filter-rules-v1/
  );
  assert.match(
    buildDiagramHtml,
    /dist-controls\.js\?v=20260721-mono-variants-v1/
  );
});

test('The shared enhancer fits Combo EditBox width to every select option', function() {
  assert.match(helperScript, /function measureSelectContentWidth\(select, control\)/);
  assert.match(helperScript, /Array\.prototype\.forEach\.call\(select\.options,/);
  assert.match(helperScript, /\.fui-combobox-arrow/);
  assert.match(helperScript, /control\.resize\(/);
  assert.match(
    helperScript,
    /control\.loadData\(readSelectData\(select\), true\);[\s\S]*?fitSelectWidth\(select, control, size\.width\);/
  );
});

test('The Grid Demo bridges live Number EditBox input to source controls', function() {
  var inputListener = null;
  var dispatchedEvents = [];
  var source = {
    dispatchEvent: function(event) {
      dispatchedEvents.push(event.type);
    }
  };
  var numberControl = {
    getEditorType: function() {
      return 'number';
    },
    textbox: function() {
      return {
        addEventListener: function(name, listener) {
          assert.equal(name, 'input');
          inputListener = listener;
        }
      };
    }
  };
  var textControl = {
    getEditorType: function() {
      return 'text';
    },
    textbox: numberControl.textbox
  };

  assert.equal(bridgeNumberEditBoxInput(source, numberControl, 'input'), true);
  assert.equal(typeof inputListener, 'function');
  inputListener();
  assert.deepEqual(dispatchedEvents, ['input']);
  assert.equal(bridgeNumberEditBoxInput(source, textControl, 'input'), false);
  assert.equal(bridgeNumberEditBoxInput(source, numberControl, 'change'), false);
});

test('The Windows 7 Demo remembers only supported themes', function() {
  var stored = null;
  var storage = {
    getItem: function() {
      return stored;
    },
    setItem: function(name, value) {
      assert.equal(name, 'fabui.win7.theme');
      stored = value;
    }
  };
  var blockedStorage = {
    getItem: function() {
      throw new Error('blocked');
    },
    setItem: function() {
      throw new Error('blocked');
    }
  };

  assert.equal(normalizeWin7Theme('metro-blue'), 'metro-blue');
  assert.equal(normalizeWin7Theme('unknown-theme'), 'default');
  assert.equal(readWin7Theme(storage), 'default');
  assert.equal(writeWin7Theme(storage, 'black'), true);
  assert.equal(stored, 'black');
  assert.equal(readWin7Theme(storage), 'black');
  assert.equal(writeWin7Theme(storage, 'unknown-theme'), true);
  assert.equal(stored, 'default');
  assert.equal(readWin7Theme(blockedStorage), 'default');
  assert.equal(writeWin7Theme(blockedStorage, 'black'), false);
});

test('The Windows 7 source Demo composes FabUI controls', function() {
  assert.match(win7Html, /\.\.\/src\/fabui\.css/);
  assert.match(win7Html, /from '\.\.\/src\/fabui\.js/);
  assert.match(win7Html, /id="win7-computer-window"/);
  assert.match(win7Html, /id="win7-network-window"/);
  assert.match(win7Html, /id="win7-monitor-window"/);
  assert.match(win7Html, /id="win7-layout"/);
  assert.match(win7Html, /id="win7-tree"/);
  assert.match(win7Html, /id="win7-tabs"/);
  assert.match(win7Html, /id="win7-grid"/);
  assert.match(win7Html, /id="win7-network-grid"/);
  assert.match(win7Html, /id="win7-monitor-chart"/);
  assert.match(win7Html, /id="win7-start-menu"/);
  assert.match(win7Html, /id="win7-desktop-menu"/);
  assert.match(win7Html, /id="win7-task-computer" hidden/);
  assert.match(win7Html, /id="win7-task-network" hidden/);
  assert.match(win7Html, /id="win7-task-monitor" hidden/);
  assert.doesNotMatch(win7Html, /id="win7-task-about"/);
  assert.match(win7Html, /class="win7-shortcut-icon icon-win7-computer"/);
  assert.match(win7Html, /class="win7-shortcut-icon icon-win7-network"/);
  assert.match(win7Html, /class="win7-shortcut-icon icon-win7-monitor"/);
  assert.equal((win7Script.match(/new fabui\.Window/g) || []).length, 3);
  assert.match(win7Script, /new fabui\.Layout/);
  assert.match(win7Script, /new fabui\.Tree/);
  assert.match(win7Script, /new fabui\.Tabs/);
  assert.equal((win7Script.match(/new fabui\.FabGrid/g) || []).length, 2);
  assert.match(win7Script, /new fabui\.Chart/);
  assert.match(win7Script, /new fabui\.Button/);
  assert.match(win7Script, /new fabui\.Menu/);
  assert.match(win7Script, /var WIN7_THEMES = \[/);
  assert.match(win7Script, /desktop\.addEventListener\('contextmenu'/);
  assert.match(win7Script, /desktop\.addEventListener\('keydown'/);
  assert.match(win7Script, /control\.setTheme\('inherit'\)/);
  assert.match(win7Script, /applyTheme\(readWin7Theme\(themeStorage\), false\)/);
  assert.match(win7Script, /writeWin7Theme\(themeStorage, theme\)/);
  assert.match(win7Script, /function makeShortcutDraggable/);
  assert.match(win7Script, /setPointerCapture\(event\.pointerId\)/);
  assert.match(win7Script, /function minimizeToTaskbar\(name\)/);
  assert.match(win7Script, /function revealTaskbarTarget\(name\)/);
  assert.equal((win7Script.match(/minimizeTarget:\s*function\(\)/g) || []).length, 3);
  assert.match(win7Script, /function getMinimizeAnimationDelay\(control\)/);
  assert.match(win7Script, /control\.options\.animationDuration/);
  assert.match(win7Script, /prefers-reduced-motion:\s*reduce/);
  assert.match(
    win7Script,
    /minimizeHideTimers\[name\] = window\.setTimeout\(function\(\)/
  );
  assert.match(
    win7Script,
    /if \(control\.options\.minimized && !control\.options\.closed\)/
  );
  assert.match(win7Script, /clearMinimizeHideTimer\(name\)/);
  assert.match(win7Script, /taskElements\[name\]\.hidden = false/);
  assert.match(win7Script, /taskElements\[name\]\.hidden = true/);
  assert.match(win7Script, /control\.windowElement\.hidden = false/);
  assert.match(win7Script, /window\.setInterval\(updateClock, 1000\)/);
});

test('Every build-mode Demo loads dist FabUI and the shared control enhancer', function() {
  var pages = getBuildPages();

  assert.ok(pages.length > 0);
  pages.forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.match(
      html,
      /<link\s+rel="stylesheet"\s+href="\.\.\/dist\/fabui\.css\?v=20260721-mono-theme-v3"\s*\/?>/,
      name
    );
    assert.match(
      html,
      /<script src="\.\.\/dist\/fabui(?:\.min)?\.js(?:\?[^"]*)?"><\/script>/,
      name
    );
    assert.match(
      html,
      /<script type="module" src="\.\/js\/dist-controls\.js\?v=20260721-mono-variants-v1"><\/script>/,
      name
    );
    assert.doesNotMatch(html, /\.\.\/src\//, name);
  });
});

test('Every webpage stylesheet reference uses the FabUI dist filename', function() {
  var sources = readdirSync(demoDirectory)
    .filter(function(name) {
      return /\.html$/.test(name);
    })
    .map(function(name) {
      return {
        name: name,
        source: readFileSync(new URL(name, demoDirectory), 'utf8')
      };
    });
  var vueDirectory = new URL('../demo/js/', import.meta.url);

  ['grid-grid-vue2.vue', 'grid-treegrid-vue2.vue'].forEach(function(name) {
    sources.push({
      name: 'js/' + name,
      source: readFileSync(new URL(name, vueDirectory), 'utf8')
    });
  });

  sources.forEach(function(item) {
    assert.doesNotMatch(
      item.source,
      /(?:src|dist)\/(?:theme\/)?fabgrid[^"'();\s]*\.css/i,
      item.name
    );
  });

  sources.filter(function(item) {
    return /(?:href=|@import\s+)["']\.\.\/dist\/fabui\.css/.test(item.source);
  }).forEach(function(item) {
    assert.match(
      item.source,
      /\.\.\/dist\/fabui\.css\?v=20260721-mono-theme-v3/,
      item.name
    );
  });
});

test('Source-mode Demo Button hosts use anchors consistently', function() {
  var pages = readdirSync(demoDirectory)
    .filter(function(name) {
      return /^dev-.*\.html$/.test(name);
    });

  pages.forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.doesNotMatch(html, /<button\b/i, name);
    Array.from(html.matchAll(/<a\b[^>]*data-fabui-button[^>]*>/gi))
      .forEach(function(match) {
        assert.match(match[0], /\bhref="javascript:void\(0\)"/, name);
      });
  });
});

test('Build-mode Demo Button hosts use anchors consistently', function() {
  getBuildPages().forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.doesNotMatch(html, /<button\b/i, name);
  });
});

test('Build-mode Demo inline styles do not repaint native control descendants', function() {
  getBuildPages().forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    var styles = Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/g))
      .map(function(match) {
        return match[1];
      })
      .join('\n');

    Array.from(styles.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      .forEach(function(match) {
        var selector = match[1].trim();
        var targetsNativeControl = /(^|[\s>+~,])(button|select|input|textarea)(?=$|[\s.:#\[\]>+~,])/.test(selector);
        assert.equal(
          targetsNativeControl,
          false,
          name + ': ' + selector
        );
      });
  });
});

test('Demo indexes expose source-mode and build-mode pages separately', function() {
  var indexHtml = readFileSync(new URL('index.html', demoDirectory), 'utf8');
  var devHtml = readFileSync(new URL('dev.html', demoDirectory), 'utf8');
  var devIndexScript = readFileSync(new URL('js/dev-index.js', demoDirectory), 'utf8');

  assert.doesNotMatch(indexHtml, /<th>開發版<\/th>/);
  assert.doesNotMatch(indexHtml, /href=["']\.\/dev-[^"']*\.html["']/i);
  assert.match(indexHtml, /<th>正式版<\/th>/);
  assert.match(indexHtml, /href=["']\.\/grid\.html["']/i);
  assert.match(devHtml, /<th>開發版<\/th>/);
  assert.match(devHtml, /<th>正式版<\/th>/);
  assert.match(devHtml, /href=["']\.\/dev-grid\.html["']/i);
  assert.match(devHtml, /href=["']\.\/grid\.html["']/i);
  assert.match(devHtml, /<tbody id=["']demo-list["']>/);
  assert.match(devHtml, /src=["']\.\/js\/dev-index\.js["']/);
  assert.match(
    devHtml,
    /tbody td:not\(:first-child\) a\s*\{\s*cursor:\s*default;/
  );
  assert.match(devIndexScript, /handle\.draggable = true/);
  assert.doesNotMatch(devIndexScript, /row\.draggable = true/);
  assert.match(devIndexScript, /link\.draggable = false/);
  assert.match(devIndexScript, /getDragHandle\(event\.target\)/);
  assert.match(devIndexScript, /addEventListener\('dragstart'/);
  assert.match(devIndexScript, /addEventListener\('dragover'/);
  assert.match(devIndexScript, /list\.insertBefore\(draggingRow,/);
  assert.deepEqual(
    Array.from(indexHtml.matchAll(/<tr><td>([^<]+)<\/td><td><a href=/g), function(match) {
      return match[1];
    }),
    readShowcasePairs().map(function(pair) {
      return pair.label;
    })
  );
  assert.deepEqual(
    Array.from(devHtml.matchAll(/<tr><td>([^<]+)<\/td>/g), function(match) {
      return match[1];
    }),
    [
      'FabGrid',
      'FabGrid Remote',
      'TreeGrid',
      'fabui.Tree',
      'fabui.Window',
      'fabui.Layout',
      'fabui.Panel',
      'fabui.Accordion',
      'fabui.Tabs',
      'fabui.Form',
      'fabui.EditBox',
      'fabui.FileBox',
      'fabui.Button',
      'fabui.SplitButton',
      'fabui.Menu',
      'fabui.MenuButton',
      'fabui.Calendar',
      'fabui.CheckBox',
      'fabui.SwitchButton',
      'fabui.CheckGroup',
      'fabui.RadioButton',
      'fabui.RadioGroup',
      'fabui.PropertyGrid',
      'fabui.Messager',
      'fabui.Tooltip',
      'Grid / Grid 拖曳',
      'Grid / TreeGrid 拖曳',
      'Grid / Chart',
      'PivotGrid',
      'PivotWorkspace',
      'Pivot 大資料與進階計算',
      'Windows 7 Desktop',
      'fabui.Diagram',
      'fabui.Gantt',
      'fabui.Scheduler',
      'FabUI Theme Builder'
    ]
  );
  assert.doesNotMatch(
    indexHtml + devHtml,
    /(?:src|href)=["'][^"']*(?:src|dist)\/fabui|data-fabui-button|class=["'][^"']*\bfui-button\b/i
  );
  assert.doesNotMatch(indexHtml, /<script\b/i);
});

test('Every build-mode Demo mirrors its source-mode showcase', function() {
  var pairs = readShowcasePairs();

  assert.equal(pairs.length, 34);
  pairs.forEach(function(pair) {
    var devHtml = readFileSync(new URL(pair.dev, demoDirectory), 'utf8');
    var buildHtml = readFileSync(new URL(pair.build, demoDirectory), 'utf8');
    var devSignature = readShowcaseSignature(devHtml);
    var devOnlyIds = pair.dev === 'dev-editbox.html' ? [
      'edit-spinner-true',
      'edit-spinner-right',
      'edit-spinner-left',
      'edit-time',
      'edit-time-seconds'
    ] : [];

    devSignature.ids = devSignature.ids.filter(function(id) {
      return devOnlyIds.indexOf(id) < 0;
    });
    devSignature.inputs = devSignature.inputs.filter(function(input) {
      return devOnlyIds.indexOf(input.id) < 0;
    });

    assert.deepEqual(
      readShowcaseSignature(buildHtml),
      devSignature,
      pair.label + ': ' + pair.dev + ' <=> ' + pair.build
    );
  });
});

test('Source-mode Demo styles do not repaint FabUI button hosts', function() {
  var pages = readdirSync(demoDirectory)
    .filter(function(name) {
      return /^dev-.*\.html$/.test(name);
    });
  var styleDirectory = new URL('../demo/style/', import.meta.url);
  var sources = pages.map(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    var styles = Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/g))
      .map(function(match) {
        return match[1];
      })
      .join('\n');
    return { name: name, css: styles };
  });

  readdirSync(styleDirectory)
    .filter(function(name) {
      return /\.css$/.test(name);
    })
    .forEach(function(name) {
      sources.push({
        name: 'style/' + name,
        css: readFileSync(new URL(name, styleDirectory), 'utf8')
      });
    });

  sources.forEach(function(source) {
    Array.from(source.css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      .forEach(function(match) {
        var selector = match[1].trim();
        var declarations = match[2];
        var targetsButton = /(^|[\s>+~,])button(?=$|[\s.:#\[\]>+~,])/.test(selector);
        var excludesFabUIButton = /:not\(\.fui-button\)/.test(selector);
        var isGridInternal = /\.tree-filter-input-wrap\s+button/.test(selector);
        var repaintsButton = /(?:^|;)\s*(?:background|border(?:-[\w-]+)?|color|font(?:-[\w-]+)?|height|min-height|padding(?:-[\w-]+)?)\s*:/.test(declarations);
        assert.equal(
          targetsButton && !excludesFabUIButton && !isGridInternal && repaintsButton,
          false,
          source.name + ': ' + selector
        );
      });
  });
});
