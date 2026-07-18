import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createMenuFactory,
  normalizeMenuAlign,
  normalizeMenuLocale,
  normalizeMenuTheme,
  parseMenuDataOptions
} from '../src/menu/menu.js';

test('FabUI core publishes Menu', function() {
  assert.equal(typeof fabui.Menu, 'function');
});

test('Menu exposes the documented FabUI defaults', function() {
  assert.equal(fabui.Menu.defaults.zIndex, 110000);
  assert.equal(fabui.Menu.defaults.left, 0);
  assert.equal(fabui.Menu.defaults.top, 0);
  assert.equal(fabui.Menu.defaults.align, 'left');
  assert.equal(fabui.Menu.defaults.minWidth, 120);
  assert.equal(fabui.Menu.defaults.itemHeight, 32);
  assert.equal(fabui.Menu.defaults.duration, 100);
  assert.equal(fabui.Menu.defaults.hideOnUnhover, true);
  assert.equal(fabui.Menu.defaults.inline, false);
  assert.equal(fabui.Menu.defaults.fit, false);
});

test('Menu normalizes themes, alignment and locale', function() {
  assert.equal(normalizeMenuTheme('material-teal'), 'material-teal');
  assert.equal(normalizeMenuTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeMenuTheme('unknown'), 'default');
  assert.equal(normalizeMenuAlign('RIGHT'), 'right');
  assert.equal(normalizeMenuAlign('center'), 'left');
  assert.equal(normalizeMenuLocale('zh-TW'), 'zh-TW');
  assert.equal(normalizeMenuLocale('fr'), 'en');
});

test('Menu parses declarative data values without executing code', function() {
  var options = parseMenuDataOptions(
    "name:'save',iconCls:'icon-save',disabled:true,count:3,onclick:function(){throw new Error('no')}"
  );
  assert.equal(options.name, 'save');
  assert.equal(options.iconCls, 'icon-save');
  assert.equal(options.disabled, true);
  assert.equal(options.count, 3);
  assert.match(options.onclick, /^function\(\)/);
  assert.equal(typeof options.onclick, 'string');
});

test('Menu factory exposes locale packs and public helpers', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  var Menu = createMenuFactory(Control, function() {}, function() {});
  assert.equal(typeof Menu, 'function');
  assert.equal(Menu.locales['zh-TW'].menu, '選單');
  assert.equal(Menu.locales['zh-CN'].submenu, '子菜单');
  assert.equal(Menu.normalizeTheme('sunny'), 'sunny');
  assert.equal(Menu.normalizeAlign('right'), 'right');
});

test('Menu source includes runtime item APIs and open-only global listeners', function() {
  var source = fs.readFileSync('src/menu/menu.js', 'utf8');
  [
    'show',
    'hide',
    'getItem',
    'setText',
    'setIcon',
    'findItem',
    'findItems',
    'navItems',
    'appendItem',
    'removeItem',
    'enableItem',
    'disableItem',
    'showItem',
    'hideItem',
    'resize'
  ].forEach(function(name) {
    assert.match(source, new RegExp('FabMenu\\.prototype\\.' + name + '\\s*='));
  });
  assert.match(source, /FabMenu\.prototype\._bindOpenEvents\s*=/);
  assert.match(source, /FabMenu\.prototype\._unbindOpenEvents\s*=/);
  assert.match(source, /addEventListener\(document,\s*'pointerdown'/);
  assert.match(source, /removeEventListener\(document,\s*'pointerdown'/);
  assert.match(source, /self\._triggerElement && self\._triggerElement\.contains\(event\.target\)/);
});
