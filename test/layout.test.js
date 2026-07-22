import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import coreFabui from '../src/fabui.js';
import {
  calculateLayoutRects,
  normalizeLayoutRegion
} from '../src/layout/layout.js';

test('FabUI core publishes Layout', function() {
  assert.equal(typeof coreFabui.Layout, 'function');
});

test('Layout normalizes the five supported regions', function() {
  assert.equal(normalizeLayoutRegion('NORTH'), 'north');
  assert.equal(normalizeLayoutRegion('center'), 'center');
  assert.equal(normalizeLayoutRegion('invalid'), null);
});

test('Layout calculates docked region and splitter rectangles', function() {
  var rects = calculateLayoutRects(
    { width: 800, height: 600 },
    {
      north: { exists: true, size: 80, split: true, splitSize: 5 },
      south: { exists: true, size: 60, split: false },
      west: { exists: true, size: 180, split: true, splitSize: 5 },
      east: { exists: true, size: 140, split: true, splitSize: 5 },
      center: { exists: true }
    }
  );
  assert.deepEqual(rects.north, { left: 0, top: 0, width: 800, height: 80 });
  assert.deepEqual(rects.northSplitter, { left: 0, top: 80, width: 800, height: 5 });
  assert.deepEqual(rects.west, { left: 0, top: 85, width: 180, height: 455 });
  assert.deepEqual(rects.east, { left: 660, top: 85, width: 140, height: 455 });
  assert.deepEqual(rects.center, { left: 185, top: 85, width: 470, height: 455 });
});

test('Layout reserves collapsed edge size without a splitter', function() {
  var rects = calculateLayoutRects(
    { width: 500, height: 300 },
    {
      west: {
        exists: true,
        collapsed: true,
        collapsedSize: 28,
        split: true,
        splitSize: 5
      },
      center: { exists: true }
    }
  );
  assert.deepEqual(rects.west, { left: 0, top: 0, width: 28, height: 300 });
  assert.equal(rects.westSplitter, undefined);
  assert.deepEqual(rects.center, { left: 28, top: 0, width: 472, height: 300 });
});

test('Layout exposes EasyUI-compatible region defaults', function() {
  assert.equal(coreFabui.Layout.defaults.fit, false);
  assert.equal(coreFabui.Layout.regionDefaults.split, false);
  assert.equal(coreFabui.Layout.regionDefaults.collapsible, true);
  assert.equal(coreFabui.Layout.regionDefaults.expandMode, 'float');
  assert.equal(coreFabui.Layout.regionDefaults.collapsedSize, 28);
  assert.equal(coreFabui.Layout.defaults.animate, true);
  assert.equal(coreFabui.Layout.defaults.animationDuration, 180);
});

test('Layout theme styles match every EasyUI layout reference palette', function() {
  var baseCss = readFileSync(
    new URL('../src/layout/layout.css', import.meta.url),
    'utf8'
  );
  var expected = {
    default: ['#e6eef8', '#aac5e7', '#e0ecff', '#95b8e7', '#0e2d5f', '14px'],
    bootstrap: ['#eee', '#bbb', '#f2f2f2', '#d4d4d4', '#777', '12px'],
    cupertino: ['#f2f5f7', '#aed0ea', '#d7ebf9', '#aed0ea', '#2779aa', '14px'],
    material: ['#fff', '#ccc', '#f5f5f5', '#ddd', '#000', '14px'],
    'material-blue': ['#fff', '#ccc', '#f5f5f5', '#dfdfdf', '#404040', '14px'],
    'material-teal': ['#fff', '#ccc', '#fafafa', '#dfdfdf', '#404040', '14px'],
    metro: ['#fff', '#b3b3b3', '#fff', '#ddd', '#777', '14px'],
    'metro-blue': ['#fafafa', '#1a7bc9', '#daeef5', '#c3d9e0', '#404040', '14px'],
    'metro-gray': ['#fafafa', '#84909c', '#c7ccd1', '#abafb8', '#404040', '14px'],
    'metro-green': ['#fafafa', '#859416', '#e5f0c9', '#b1c242', '#404040', '14px'],
    'metro-orange': ['#fafafa', '#de8033', '#f0e3bf', '#d4a375', '#404040', '14px'],
    'metro-red': ['#fafafa', '#c75252', '#f0e1e3', '#f6c1bc', '#404040', '14px'],
    sunny: ['#a69e8d', '#817865', '#817865', '#494437', '#fff', '14px'],
    'pepper-grinder': ['#eceadf', '#cbc7bd', '#f8f7f6', '#cbc7bd', '#654b24', '14px'],
    'dark-hive': ['#000', '#26b3f7', '#222', '#444', '#eee', '14px'],
    black: ['#444', '#ccc', '#3d3d3d', '#000', '#fff', '14px']
  };
  var names = [
    '--fui-layout-splitter',
    '--fui-layout-splitter-active',
    '--fui-layout-expand-bg',
    '--fui-layout-expand-border',
    '--fui-layout-expand-text',
    '--fui-layout-font-size'
  ];

  Object.keys(expected).forEach(function(theme) {
    var css = theme === 'default' ? baseCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var match = Array.from(css.matchAll(/\.fui-layout\s*\{([^}]*)\}/g))
      .find(function(entry) {
        return entry[1].toLowerCase().includes(expected[theme][0].toLowerCase());
      });
    assert.ok(match, theme);
    names.forEach(function(name, index) {
      assert.match(
        match[1],
        new RegExp(name + ':\\s*' + expected[theme][index], 'i'),
        theme + ' ' + name
      );
    });
  });

  assert.match(baseCss, /background:\s*var\(--fui-layout-splitter\)/);
  assert.match(baseCss, /background:\s*var\(--fui-layout-splitter-active\)/);
  assert.doesNotMatch(baseCss, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});

test('Layout uses the matching EasyUI arrow sprite for every theme', function() {
  var iconCss = readFileSync(
    new URL('../src/fabui.icon.css', import.meta.url),
    'utf8'
  );
  var expectedHashes = {
    default: 'cc6a4bfc5bbb05eb1b524628ce5df66f3ba0b657',
    bootstrap: 'cc6a4bfc5bbb05eb1b524628ce5df66f3ba0b657',
    cupertino: '69372e294154c8abad0ab638bbdb3a6cea440715',
    material: '64210f19e5c0104cc0dc36a549e7efe17d4640f9',
    'material-blue': '64210f19e5c0104cc0dc36a549e7efe17d4640f9',
    'material-teal': '64210f19e5c0104cc0dc36a549e7efe17d4640f9',
    metro: 'cc6a4bfc5bbb05eb1b524628ce5df66f3ba0b657',
    'metro-blue': '69372e294154c8abad0ab638bbdb3a6cea440715',
    'metro-gray': '69372e294154c8abad0ab638bbdb3a6cea440715',
    'metro-green': '69372e294154c8abad0ab638bbdb3a6cea440715',
    'metro-orange': '69372e294154c8abad0ab638bbdb3a6cea440715',
    'metro-red': '69372e294154c8abad0ab638bbdb3a6cea440715',
    sunny: '69372e294154c8abad0ab638bbdb3a6cea440715',
    'pepper-grinder': '69372e294154c8abad0ab638bbdb3a6cea440715',
    'dark-hive': '1f6b921e7d4003e817e56b5b83fa48d3e9208ece',
    black: '1f6b921e7d4003e817e56b5b83fa48d3e9208ece'
  };

  Object.keys(expectedHashes).forEach(function(theme) {
    var themeCss = theme === 'default' ? iconCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var png = readFileSync(
      new URL(
        '../src/theme/' + theme + '/images/layout_arrows.png',
        import.meta.url
      )
    );
    var hash = createHash('sha1').update(png).digest('hex');
    assert.equal(hash, expectedHashes[theme], theme);
    assert.match(
      themeCss,
      /--fui-layout-arrows:\s*url\('[^']*layout_arrows\.png'\)/,
      theme
    );
  });

  assert.match(iconCss, /\.fui-layout-button-up[\s\S]*background-position:\s*-16px -16px/);
  assert.match(iconCss, /\.fui-layout-button-right[\s\S]*background-position:\s*0 -16px/);
});

test('Layout collapse and expand icons do not change on mouse hover', function() {
  var css = readFileSync(
    new URL('../src/layout/layout.css', import.meta.url),
    'utf8'
  );
  var panelCss = readFileSync(
    new URL('../src/panel/panel.css', import.meta.url),
    'utf8'
  );
  var panelToolRule = panelCss.match(/\.fui-panel-tool\s*\{([\s\S]*?)\}/);
  var expandButtonRule = css.match(
    /\.fui-layout-expand-button\s*\{([\s\S]*?)\}/
  );

  assert.match(
    css,
    /\.fui-layout-expand-button:hover\s*\{[\s\S]*?background-color:\s*transparent;/
  );
  assert.match(css, /\.fui-layout-expand-button:focus-visible/);
  assert.match(
    css,
    /\.fui-layout \.fui-panel-tool\.fui-layout-button-up:hover,[\s\S]*?background-color:\s*transparent;[\s\S]*?opacity:\s*0\.6;/
  );
  assert.doesNotMatch(css, /fui-layout-button-(?:up|down|left|right):hover:not/);
  assert.ok(panelToolRule);
  assert.match(panelToolRule[1], /background-color:\s*transparent;/);
  assert.doesNotMatch(panelToolRule[1], /background:\s*transparent;/);
  assert.ok(expandButtonRule);
  assert.match(expandButtonRule[1], /background-color:\s*transparent;/);
  assert.doesNotMatch(expandButtonRule[1], /background:\s*transparent;/);
});

test('Layout highlights only the splitter being dragged', function() {
  var css = readFileSync(
    new URL('../src/layout/layout.css', import.meta.url),
    'utf8'
  );
  var source = readFileSync(
    new URL('../src/layout/layout.js', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(css, /\.fui-layout-splitter:hover/);
  assert.doesNotMatch(css, /\.fui-layout-resizing \.fui-layout-splitter/);
  assert.match(
    css,
    /\.fui-layout-splitter-dragging\s*\{[\s\S]*?z-index:\s*8;[\s\S]*?background:\s*var\(--fui-layout-splitter-active\);/
  );
  assert.match(
    source,
    /splitter\.classList\.add\('fui-layout-splitter-dragging'\)/
  );
  assert.match(
    source,
    /splitter\.classList\.remove\('fui-layout-splitter-dragging'\)/
  );
});

test('Layout previews splitter movement and resizes panels only on pointer release', function() {
  var source = readFileSync(
    new URL('../src/layout/layout.js', import.meta.url),
    'utf8'
  );
  var moveSource = source.match(
    /FabLayout\.prototype\._handleSplitMove\s*=\s*function\(event\)\s*\{([\s\S]*?)\n  \};/
  );
  var finishSource = source.match(
    /FabLayout\.prototype\._finishSplit\s*=\s*function\(event\)\s*\{([\s\S]*?)\n  \};/
  );

  assert.ok(moveSource);
  assert.ok(finishSource);
  assert.match(moveSource[1], /state\.pendingSize\s*=\s*size/);
  assert.match(moveSource[1], /splitter\.style\.transform/);
  assert.doesNotMatch(moveSource[1], /_setRegionSize/);
  assert.match(finishSource[1], /event\.type\s*===\s*'pointercancel'/);
  assert.match(
    finishSource[1],
    /this\._setRegionSize\(state\.region,\s*state\.pendingSize\)/
  );
  assert.match(finishSource[1], /splitter\.style\.removeProperty\('transform'\)/);
});

test('Layout demos expose controls for all four collapsible edge regions', function() {
  var demoSource = readFileSync(
    new URL('../demo/layout.html', import.meta.url),
    'utf8'
  );
  var devDemoSource = readFileSync(
    new URL('../demo/dev-layout.html', import.meta.url),
    'utf8'
  );
  var scriptSource = readFileSync(
    new URL('../demo/js/layout-demo.js', import.meta.url),
    'utf8'
  );

  ['north', 'south', 'west', 'east'].forEach(function(region) {
    var controlPattern = new RegExp('id="toggle-' + region + '"');
    var handlerPattern = new RegExp("toggleRegion\\('" + region + "'\\)");

    assert.match(demoSource, controlPattern);
    assert.match(devDemoSource, controlPattern);
    assert.match(scriptSource, handlerPattern);
  });
});
