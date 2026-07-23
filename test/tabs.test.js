import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createTabsFactory,
  normalizeTabsTheme,
  reorderTabRecords,
  resolveTabDropIndex,
  resolveTabDropSide
} from '../src/tabs/tabs.js';

test('FabUI core publishes Tabs', function() {
  assert.equal(typeof fabui.Tabs, 'function');
});

test('Tabs exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.Tabs.defaults.width, 'auto');
  assert.equal(fabui.Tabs.defaults.height, 'auto');
  assert.equal(fabui.Tabs.defaults.fit, false);
  assert.equal(fabui.Tabs.defaults.border, true);
  assert.equal(fabui.Tabs.defaults.plain, false);
  assert.equal(fabui.Tabs.defaults.scrollIncrement, 100);
  assert.equal(fabui.Tabs.defaults.scrollDuration, 400);
  assert.equal(fabui.Tabs.defaults.toolPosition, 'right');
  assert.equal(fabui.Tabs.defaults.tabPosition, 'top');
  assert.equal(fabui.Tabs.defaults.headerWidth, 150);
  assert.equal(fabui.Tabs.defaults.tabHeight, 28);
  assert.equal(fabui.Tabs.defaults.selected, 0);
  assert.equal(fabui.Tabs.defaults.showHeader, true);
  assert.equal(fabui.Tabs.defaults.justified, false);
  assert.equal(fabui.Tabs.defaults.narrow, false);
  assert.equal(fabui.Tabs.defaults.pill, false);
  assert.equal(fabui.Tabs.defaults.draggable, false);
});

test('Tabs normalizes supported themes and aliases', function() {
  assert.equal(normalizeTabsTheme('material-teal'), 'material-teal');
  assert.equal(normalizeTabsTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeTabsTheme(' BLACK '), 'black');
  assert.equal(normalizeTabsTheme('unknown'), 'default');
});

test('Tabs publishes all required locale packs', function() {
  assert.deepEqual(Object.keys(fabui.Tabs.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.Tabs.locales.en.previous, 'Previous tabs');
  assert.equal(fabui.Tabs.locales['zh-TW'].next, '下一組頁籤');
  assert.equal(fabui.Tabs.locales['zh-CN'].close, '关闭 {title}');
});

test('Tabs factory returns a public control class', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  var Tabs = createTabsFactory(Control, function() {}, function() {});
  assert.equal(typeof Tabs, 'function');
  assert.equal(Tabs.defaults.showHeader, true);
  assert.equal(Tabs.normalizeTheme('sunny'), 'sunny');
  assert.equal(Tabs.prototype.dispose, Tabs.prototype.destroy);
});

test('Tabs cancels stale remote content loads', function() {
  var source = readFileSync(
    new URL('../src/tabs/tabs.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /loadSequence: 0, loadController: null/);
  assert.match(source, /Tabs\.prototype\._cancelLoad/);
  assert.match(source, /sequence !== record\.loadSequence/);
  assert.match(source, /self\._tabs\.indexOf\(record\) < 0/);
  assert.match(source, /Tabs\.prototype\.close[\s\S]*this\._cancelLoad\(record\)/);
  assert.match(source, /Tabs\.prototype\.destroy[\s\S]*this\._tabs\.forEach\(this\._cancelLoad\.bind\(this\)\)/);
});

test('Tabs scroll buttons render one sprite icon without text overlap', function() {
  var source = readFileSync(new URL('../src/tabs/tabs.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/tabs/tabs.css', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /previous\.textContent\s*=\s*['"]‹['"]/);
  assert.doesNotMatch(source, /next\.textContent\s*=\s*['"]›['"]/);
  assert.match(css, /\.fui-tabs-scroll:hover\s*\{\s*background-color:/);
  assert.match(css, /\.fui-tabs-scroll-prev[\s\S]*?background-position:/);
  assert.match(css, /\.fui-tabs-scroll-next[\s\S]*?background-position:/);
});

test('Tabs keeps overflow controls and unselect events synchronized', function() {
  var source = readFileSync(new URL('../src/tabs/tabs.js', import.meta.url), 'utf8');
  assert.match(source, /this\._onTabScroll = function\(\) \{ self\._syncOverflow\(\); \};/);
  assert.match(source, /addEventListener\(this\.viewport, 'scroll', this\._onTabScroll\)/);
  assert.match(source, /this\._emit\('unselect', \{/);
});

test('Tabs keeps tab and panel ARIA ids synchronized', function() {
  var source = readFileSync(new URL('../src/tabs/tabs.js', import.meta.url), 'utf8');
  assert.match(
    source,
    /record\.tab\.setAttribute\('aria-controls', record\.panel\.id\);/
  );
  assert.match(
    source,
    /if \(options\.id\) panel\.id = String\(options\.id\);[\s\S]*?this\._createRecord\(panel, options\)/
  );
});

test('Tabs reorder helper moves one record and rejects unchanged indexes', function() {
  var records = ['alpha', 'beta', 'gamma', 'delta'];
  assert.equal(reorderTabRecords(records, 1, 3), true);
  assert.deepEqual(records, ['alpha', 'gamma', 'delta', 'beta']);
  assert.equal(reorderTabRecords(records, 3, 0), true);
  assert.deepEqual(records, ['beta', 'alpha', 'gamma', 'delta']);
  assert.equal(reorderTabRecords(records, 0, 0), false);
  assert.equal(reorderTabRecords(records, -1, 2), false);
});

test('Tabs drop index and indicator side follow the drag direction', function() {
  assert.equal(resolveTabDropIndex(3, 0, 5), 0);
  assert.equal(resolveTabDropIndex(3, 2, 5), 2);
  assert.equal(resolveTabDropIndex(0, 2, 5), 2);
  assert.equal(resolveTabDropIndex(2, 4, 5), 4);
  assert.equal(resolveTabDropIndex(2, 2, 5), 2);
  assert.equal(resolveTabDropIndex(-1, 2, 5), -1);
  assert.equal(resolveTabDropSide(3, 0), 'before');
  assert.equal(resolveTabDropSide(0, 2), 'after');
  assert.equal(resolveTabDropSide(2, 2), null);
});

test('Tabs draggable mode uses directional complementary semi-transparent indicators', function() {
  var source = readFileSync(new URL('../src/tabs/tabs.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/tabs/tabs.css', import.meta.url), 'utf8');
  var defaultTheme = readFileSync(
    new URL('../src/theme/default/tabs.css', import.meta.url),
    'utf8'
  );
  assert.match(source, /var title = event\.target\.closest\('\.fui-tabs-title'\)/);
  assert.match(source, /var tab = title && title\.closest\('\.fui-tabs-tab'\)/);
  assert.match(source, /title\.draggable = this\._isHorizontalDragEnabled\(\)/);
  assert.match(source, /tab\.draggable = false/);
  assert.match(source, /addEventListener\(this\.list, 'dragstart'/);
  assert.match(source, /addEventListener\(this\.list, 'dragover'/);
  assert.match(source, /addEventListener\(this\.list, 'drop'/);
  assert.match(source, /resolveTabDropSide\(state\.fromIndex, targetIndex\)/);
  assert.match(source, /target\.classList\.add\('fui-tabs-drop-' \+ dropSide\)/);
  assert.match(css, /\.fui-tabs-drop-before::before/);
  assert.match(css, /\.fui-tabs-drop-after\s*\{[^}]*overflow: visible;/);
  assert.match(css, /\.fui-tabs-drop-before::before,[\s\S]*?\.fui-tabs-drop-after::after/);
  assert.match(css, /left: -3px/);
  assert.match(css, /right: -3px/);
  assert.match(css, /top: 0;/);
  assert.match(css, /bottom: 0;/);
  assert.doesNotMatch(css, /\.fui-tabs-drop-(?:before|after)::(?:before|after)\s*\{[^}]*border-(?:top|right|bottom|left):/);
  assert.match(css, /background: var\(--fui-tabs-drag-indicator\)/);
  assert.match(css, /opacity: var\(--fg-drag-indicator-opacity, 0\.55\)/);
  assert.match(css, /\.fui-tabs-tab\s*\{[^}]*cursor: default;/);
  assert.match(
    css,
    /\.fui-tabs-draggable \.fui-tabs-tab:not\(\.fui-tabs-disabled\) \.fui-tabs-title\s*\{[^}]*cursor: grab;/
  );
  assert.doesNotMatch(
    css,
    /\.fui-tabs-draggable \.fui-tabs-tab:not\(\.fui-tabs-disabled\)\s*\{[^}]*cursor: grab;/
  );
  assert.match(source, /event\.dataTransfer\.setDragImage\(/);
  assert.match(source, /Tabs\.prototype\._createTabDragImage/);
  assert.match(source, /Tabs\.prototype\._removeTabDragImage/);
  assert.match(source, /this\.element\.appendChild\(dragImage\)/);
  assert.doesNotMatch(
    css.match(/\.fui-tabs-tab-dragging \.fui-tabs-title\s*\{[^}]*\}/)[0],
    /opacity:/
  );
  assert.doesNotMatch(
    css.match(/\.fui-tabs-drag-image\s*\{[^}]*\}/)[0],
    /opacity:/
  );
  assert.match(
    css,
    /\.fui-tabs-drag-image\s*\{[^}]*border: 1px solid var\(--fui-tabs-border\) !important;/
  );
  assert.match(
    css,
    /\.fui-tabs-drag-image\s*>\s*\*\s*\{[^}]*opacity: 0\.5 !important;/
  );
  assert.match(css, /var\(--fui-tabs-panel-bg\) 50%/);
  assert.match(defaultTheme, /--fui-tabs-drag-indicator: #f27c22/);
});

test('Every Tabs theme defines a complementary drag indicator color', function() {
  var themes = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];
  themes.forEach(function(theme) {
    var css = readFileSync(
      new URL('../src/theme/' + theme + '/tabs.css', import.meta.url),
      'utf8'
    );
    assert.match(css, /--fui-tabs-drag-indicator:\s*#[0-9a-f]{6}/i, theme);
  });
});

test('Metro Tabs themes preserve the square reference corners', function() {
  var themes = [
    'metro', 'metro-blue', 'metro-gray',
    'metro-green', 'metro-orange', 'metro-red'
  ];
  themes.forEach(function(theme) {
    var css = readFileSync(
      new URL('../src/theme/' + theme + '/tabs.css', import.meta.url),
      'utf8'
    );
    assert.match(css, /--fui-tabs-radius:\s*0(?:px)?;/, theme);
  });
});
