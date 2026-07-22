import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import coreFabui from '../src/fabui.js';
import {
  calculateMinimizedTargetRect,
  calculateWindowResizeRect,
  calculateMinimizedWindowRect,
  constrainWindowRect,
  normalizeWindowTheme
} from '../src/window/window.js';

test('FabUI core publishes Window', function() {
  assert.equal(typeof coreFabui.Window, 'function');
});

test('Window normalizes supported themes and aliases', function() {
  assert.equal(normalizeWindowTheme('material-teal'), 'material-teal');
  assert.equal(normalizeWindowTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeWindowTheme(' BLACK '), 'black');
  assert.equal(normalizeWindowTheme('unknown'), 'default');
});

test('Window constrain keeps size and position inside its bounds', function() {
  assert.deepEqual(
    constrainWindowRect(
      { left: -20, top: 250, width: 500, height: 40 },
      { width: 420, height: 300 },
      { width: 200, height: 100 }
    ),
    { left: 0, top: 200, width: 420, height: 100 }
  );
});

test('Window constrain yields to a viewport smaller than its configured minimum', function() {
  assert.deepEqual(
    constrainWindowRect(
      { left: 20, top: 10, width: 600, height: 400 },
      { width: 120, height: 70 },
      { width: 200, height: 100 }
    ),
    { left: 0, top: 0, width: 120, height: 70 }
  );
});

test('Window calculates all resize directions without mutating the start rectangle', function() {
  var start = { left: 100, top: 80, width: 400, height: 260 };

  assert.deepEqual(
    calculateWindowResizeRect(start, 50, 30, 'se'),
    { left: 100, top: 80, width: 450, height: 290 }
  );
  assert.deepEqual(
    calculateWindowResizeRect(start, 50, 30, 'nw'),
    { left: 150, top: 110, width: 350, height: 230 }
  );
  assert.deepEqual(
    calculateWindowResizeRect(start, -20, -10, 'ne'),
    { left: 100, top: 70, width: 380, height: 270 }
  );
  assert.deepEqual(start, { left: 100, top: 80, width: 400, height: 260 });
});

test('Window pointer resize previews geometry and commits only on pointer up', function() {
  var source = readFileSync(
    new URL('../src/window/window.js', import.meta.url),
    'utf8'
  );
  var moveStart = source.indexOf(
    'FabWindow.prototype._handleInteractionMove'
  );
  var finishStart = source.indexOf(
    'FabWindow.prototype._finishInteraction',
    moveStart
  );
  var boundsStart = source.indexOf(
    'FabWindow.prototype._getBounds',
    finishStart
  );
  var moveSource = source.slice(moveStart, finishStart);
  var finishSource = source.slice(finishStart, boundsStart);
  var css = readFileSync(
    new URL('../src/window/window.css', import.meta.url),
    'utf8'
  );

  assert.match(moveSource, /state\.previewRect = rect/);
  assert.match(moveSource, /this\._applyResizeProxyRect\(rect\)/);
  assert.equal(
    (moveSource.match(/this\._applyRect\(rect\)/g) || []).length,
    1
  );
  assert.match(
    finishSource,
    /cancelled = event\.type === 'pointercancel'/
  );
  assert.match(finishSource, /this\._applyRect\(rect\)/);
  assert.match(finishSource, /else if \(!cancelled\)/);
  assert.match(css, /\.fui-window-resize-proxy\s*\{[\s\S]*?border:\s*1px dashed;/);
  assert.match(css, /\.fui-window-resize-proxy\s*\{[\s\S]*?pointer-events:\s*none;/);
});

test('Window minimized rectangle sits at the bottom-left of its bounds', function() {
  assert.deepEqual(
    calculateMinimizedWindowRect(
      { width: 1280, height: 720 },
      520
    ),
    { left: 0, top: 682, width: 220, height: 38 }
  );
  assert.deepEqual(
    calculateMinimizedWindowRect(
      { width: 160, height: 30 },
      520
    ),
    { left: 0, top: 0, width: 160, height: 30 }
  );
});

test('Window minimized target uses one exact target rectangle', function() {
  assert.deepEqual(
    calculateMinimizedTargetRect(
      { left: 88, top: 676, width: 132, height: 34 },
      { width: 1280, height: 720 }
    ),
    { left: 88, top: 676, width: 132, height: 34 }
  );
  assert.deepEqual(
    calculateMinimizedTargetRect(
      { left: 1180, top: 700, width: 180, height: 40 },
      { width: 1280, height: 720 }
    ),
    { left: 1100, top: 680, width: 180, height: 40 }
  );
  assert.equal(
    calculateMinimizedTargetRect(
      { left: 0, top: 0, width: 0, height: 34 },
      { width: 1280, height: 720 }
    ),
    null
  );
});

test('Window exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(coreFabui.Window.defaults.title, 'New Window');
  assert.equal(coreFabui.Window.defaults.draggable, true);
  assert.equal(coreFabui.Window.defaults.resizable, true);
  assert.equal(coreFabui.Window.defaults.collapsible, false);
  assert.equal(coreFabui.Window.defaults.minimizable, false);
  assert.equal(coreFabui.Window.defaults.maximizable, true);
  assert.equal(coreFabui.Window.defaults.closable, true);
  assert.equal(coreFabui.Window.defaults.modal, false);
  assert.equal(coreFabui.Window.defaults.animate, true);
  assert.equal(coreFabui.Window.defaults.animationDuration, 180);
  assert.equal(coreFabui.Window.defaults.minimizeTarget, null);
});

test('Window theme styles match every EasyUI window reference palette', function() {
  var baseCss = readFileSync(
    new URL('../src/window/window.css', import.meta.url),
    'utf8'
  );
  var expected = {
    default: ['#95b8e7', 'linear-gradient(to bottom, #eff5ff 0, #e0ecff 20%)', '5px', '#ccc', 'rgba(204, 204, 204, 0.4)'],
    bootstrap: ['#d4d4d4', 'linear-gradient(to bottom, #fff 0, #f2f2f2 20%)', '5px', '#ccc', 'rgba(204, 204, 204, 0.4)'],
    cupertino: ['#aed0ea', 'linear-gradient(to bottom, #eff5ff 0, #d7ebf9 20%)', '5px', '#ccc', 'rgba(204, 204, 204, 0.4)'],
    material: ['#ddd', '#f5f5f5', '4px', '#fafafa', 'rgba(238, 238, 238, 0.4)'],
    'material-blue': ['#dfdfdf', '#f5f5f5', '2px', '#ccc', 'rgba(238, 238, 238, 0.4)'],
    'material-teal': ['#dfdfdf', '#fafafa', '4px', '#ccc', 'rgba(238, 238, 238, 0.4)'],
    metro: ['#ddd', '#fff', '0', '#ededed', 'rgba(238, 238, 238, 0.4)'],
    'metro-blue': ['#c3d9e0', '#daeef5', '0', '#fafafa', 'rgba(238, 238, 238, 0.4)'],
    'metro-gray': ['#abafb8', '#c7ccd1', '0', '#fafafa', 'rgba(238, 238, 238, 0.4)'],
    'metro-green': ['#b1c242', '#e5f0c9', '0', '#fafafa', 'rgba(238, 238, 238, 0.4)'],
    'metro-orange': ['#d4a375', '#f0e3bf', '0', '#fafafa', 'rgba(238, 238, 238, 0.4)'],
    'metro-red': ['#f6c1bc', '#f0e1e3', '0', '#fafafa', 'rgba(238, 238, 238, 0.4)'],
    sunny: ['#494437', 'linear-gradient(to bottom, #a69e8d 0, #817865 20%)', '5px', '#ababab', 'rgba(170, 170, 170, 0.4)'],
    'pepper-grinder': ['#cbc7bd', '#f8f7f6', '5px', '#ccc', 'rgba(204, 204, 204, 0.4)'],
    'dark-hive': ['#444', 'linear-gradient(to bottom, #626262 0, #222 20%)', '5px', '#454545', 'rgba(68, 68, 68, 0.4)'],
    black: ['#000', 'linear-gradient(to bottom, #454545 0, #383838 20%)', '5px', '#787878', 'rgba(0, 0, 0, 0.4)']
  };
  var names = [
    '--fui-window-border',
    '--fui-window-frame',
    '--fui-window-border-radius',
    '--fui-window-shadow-color',
    '--fui-window-mask-bg'
  ];

  Object.keys(expected).forEach(function(theme) {
    var css = theme === 'default' ? baseCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var match = Array.from(css.matchAll(/\.fui-window\s*\{([^}]*)\}/g))
      .find(function(entry) {
        return entry[1].toLowerCase().includes(expected[theme][0].toLowerCase());
      });
    assert.ok(match, theme);
    names.forEach(function(name, index) {
      var value = expected[theme][index].replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      assert.match(
        match[1],
        new RegExp(name + ':\\s*' + value + '\\s*;', 'i'),
        theme + ' ' + name
      );
    });
  });

  assert.match(baseCss, /background:\s*var\(--fui-window-frame\)/);
  assert.match(baseCss, /background:\s*var\(--fui-window-mask-bg\)/);
  assert.match(baseCss, /box-shadow:\s*2px 2px 3px var\(--fui-window-shadow-color\)/);
  assert.doesNotMatch(baseCss, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});

test('Window built-in tool icons do not change on mouse hover', function() {
  var css = readFileSync(
    new URL('../src/window/window.css', import.meta.url),
    'utf8'
  );
  var baseToolRule = css.match(
    /\.fui-window-tool\s*\{([^}]*)\}/
  );
  var sharedStateRule = css.match(
    /\.fui-window-tool:hover,\s*\.fui-window-tool:focus-visible\s*\{([^}]*)\}/
  );
  var tools = [
    'minimize',
    'maximize',
    'restore',
    'close',
    'collapse',
    'expand'
  ];

  tools.forEach(function(tool) {
    assert.match(
      css,
      new RegExp(
        '\\.fui-window-tool-' +
        tool +
        ':hover:not\\(:focus-visible\\)'
      ),
      tool
    );
  });
  assert.ok(baseToolRule);
  assert.match(baseToolRule[1], /background-color:\s*transparent;/);
  assert.doesNotMatch(baseToolRule[1], /(?:^|\s)background:/);
  assert.match(
    css,
    /\.fui-window-tool-expand:hover:not\(:focus-visible\)[\s\S]*?background-color:\s*transparent;[\s\S]*?opacity:\s*0\.6;/
  );
  assert.ok(sharedStateRule);
  assert.match(sharedStateRule[1], /background-color:/);
  assert.doesNotMatch(sharedStateRule[1], /(?:^|\s)background:/);
  assert.match(css, /\.fui-window-tool:focus-visible/);
});

test('Window collapses to an approximately 38px title bar', function() {
  var css = readFileSync(
    new URL('../src/window/window.css', import.meta.url),
    'utf8'
  );
  var source = readFileSync(
    new URL('../src/window/window.js', import.meta.url),
    'utf8'
  );
  var collapsedClassIndex = source.indexOf(
    "classList.add('fui-window-collapsed')"
  );
  var collapsedHeightIndex = source.indexOf(
    'collapsedHeight = this._getCollapsedHeight()'
  );

  assert.match(
    css,
    /\.fui-window-collapsed,\s*\.fui-window-minimized\s*\{[\s\S]*?min-height:\s*38px;/
  );
  assert.match(
    css,
    /\.fui-window-collapsed \.fui-window-header,\s*\.fui-window-minimized \.fui-window-header\s*\{[\s\S]*?min-height:\s*26px;[\s\S]*?flex-basis:\s*26px;[\s\S]*?padding-bottom:\s*5px;/
  );
  assert.match(source, /return Math\.max\(38,/);
  assert.ok(collapsedClassIndex >= 0);
  assert.ok(collapsedHeightIndex > collapsedClassIndex);
});

test('Window source-mode demo opens the basic window centered by default', function() {
  var demo = readFileSync(
    new URL('../demo/dev-window.html', import.meta.url),
    'utf8'
  );
  var mountIndex = demo.indexOf('window.mountFabUIWindowDemo(fabui,');
  var centerIndex = demo.indexOf(
    'window.fabWindowDemo.basic.open().center()'
  );

  assert.ok(mountIndex >= 0);
  assert.ok(centerIndex > mountIndex);
});

test('Window source-mode demo renders its controls with FabUI components', function() {
  var demo = readFileSync(
    new URL('../demo/dev-window.html', import.meta.url),
    'utf8'
  );
  var script = readFileSync(
    new URL('../demo/js/window-demo.js', import.meta.url),
    'utf8'
  );

  assert.match(demo, /useFabUIControls:\s*true/);
  assert.doesNotMatch(demo, /\.demo-toolbar select,/);
  assert.doesNotMatch(demo, /\.demo-toolbar button/);
  assert.match(script, /themeControl = new fabui\.EditBox\(theme,/);
  assert.match(script, /editor:\s*'combo'/);
  assert.match(script, /buttonControls\.push\(new fabui\.Button\('#' \+ id,/);
  assert.match(script, /iconCls:\s*''/);
  assert.match(script, /'close-modal'/);
});

test('Window modal mask receives the matching theme overlay color', function() {
  var css = readFileSync(
    new URL('../src/window/window.css', import.meta.url),
    'utf8'
  );

  assert.match(
    css,
    /\.fui-window-mask\s*\{[\s\S]*?--fui-window-mask-bg:\s*rgba\(204,\s*204,\s*204,\s*0\.4\);/
  );
  assert.match(
    readFileSync(new URL('../src/theme/material/components.css', import.meta.url), 'utf8'),
    /\.fui-window-mask\s*\{[\s\S]*?--fui-window-mask-bg:\s*rgba\(238,\s*238,\s*238,\s*0\.4\);/
  );
  assert.match(
    readFileSync(new URL('../src/theme/sunny/components.css', import.meta.url), 'utf8'),
    /\.fui-window-mask\s*\{[\s\S]*?--fui-window-mask-bg:\s*rgba\(170,\s*170,\s*170,\s*0\.4\);/
  );
  assert.match(
    readFileSync(new URL('../src/theme/dark-hive/components.css', import.meta.url), 'utf8'),
    /\.fui-window-mask\s*\{[\s\S]*?--fui-window-mask-bg:\s*rgba\(68,\s*68,\s*68,\s*0\.4\);/
  );
  assert.match(
    readFileSync(new URL('../src/theme/black/components.css', import.meta.url), 'utf8'),
    /\.fui-window-mask\s*\{[\s\S]*?--fui-window-mask-bg:\s*rgba\(0,\s*0,\s*0,\s*0\.4\);/
  );
});

test('Window minimized state remains visible and exposes restore', function() {
  var css = readFileSync(
    new URL('../src/window/window.css', import.meta.url),
    'utf8'
  );
  var source = readFileSync(
    new URL('../src/window/window.js', import.meta.url),
    'utf8'
  );

  assert.match(
    css,
    /\.fui-window-collapsed,\s*\.fui-window-minimized\s*\{[\s\S]*?min-height:\s*38px;/
  );
  assert.match(
    css,
    /\.fui-window-minimized \.fui-window-tool-collapse,[\s\S]*?\.fui-window-minimized \.fui-window-tool-maximize[\s\S]*?display:\s*none;/
  );
  assert.match(
    css,
    /\.fui-window-minimized\s*\{[\s\S]*?position:\s*fixed;/
  );
  assert.match(
    css,
    /\.fui-window-minimized\.fui-window-inline\s*\{[\s\S]*?position:\s*absolute;/
  );
  assert.match(
    css,
    /\.fui-window-minimized\.fui-window-minimized-target\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?min-height:\s*0;/
  );
  assert.match(source, /this\._minimizedRestoreRect = this\._getRect\(\)/);
  assert.match(source, /target = this\.options\.minimizeTarget/);
  assert.match(source, /target\.getBoundingClientRect\(\)/);
  assert.match(
    source,
    /if \(this\.options\.minimizeTarget\)\s*\{\s*this\._applyRect\(this\._getMinimizedRect\(\)\)/
  );
  assert.match(source, /this\._animateRect\(minimizedRect\)/);
  assert.match(
    source,
    /minimize\.classList\.toggle\('fui-window-tool-restore', this\.options\.minimized\)/
  );
  assert.match(
    source,
    /if \(this\.options\.minimized\) this\.restore\(\)/
  );
  assert.doesNotMatch(
    source,
    /self\._setVisible\(false\)[\s\S]*?self\.windowElement\.classList\.remove\('fui-window-minimized-visual'\)/
  );
});
