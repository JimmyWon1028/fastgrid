import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createMenuButtonFactory,
  getMenuButtonHoverEvents,
  normalizeMenuButtonAlign
} from '../src/menubutton/menubutton.js';

test('FabUI core publishes MenuButton', function() {
  assert.equal(typeof fabui.MenuButton, 'function');
});

test('MenuButton exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.MenuButton.defaults.plain, true);
  assert.equal(fabui.MenuButton.defaults.menu, null);
  assert.equal(fabui.MenuButton.defaults.menuAlign, 'left');
  assert.equal(fabui.MenuButton.defaults.duration, 100);
  assert.equal(fabui.MenuButton.defaults.showEvent, 'mouseenter');
  assert.equal(fabui.MenuButton.defaults.hideEvent, 'mouseleave');
  assert.equal(fabui.MenuButton.defaults.hasDownArrow, true);
  assert.equal(fabui.MenuButton.defaults.iconAlign, 'left');
});

test('MenuButton normalizes top-level menu alignment', function() {
  assert.equal(normalizeMenuButtonAlign('RIGHT'), 'right');
  assert.equal(normalizeMenuButtonAlign('left'), 'left');
  assert.equal(normalizeMenuButtonAlign('center'), 'left');
});

test('MenuButton keeps trigger and popup hover events in the same event family', function() {
  assert.deepEqual(getMenuButtonHoverEvents('mouseleave'), {
    enter: 'mouseenter',
    leave: 'mouseleave'
  });
  assert.deepEqual(getMenuButtonHoverEvents('pointerleave'), {
    enter: 'pointerenter',
    leave: 'pointerleave'
  });
});

test('MenuButton factory validates shared Button and Menu dependencies', function() {
  function Control() {}
  var MenuButton = createMenuButtonFactory(
    Control,
    function() {},
    function() {},
    function Button() {},
    function Menu() {}
  );
  assert.equal(typeof MenuButton, 'function');
  assert.equal(MenuButton.normalizeMenuAlign('right'), 'right');
});

test('MenuButton source composes Button and Menu and exposes runtime APIs', function() {
  var source = fs.readFileSync('src/menubutton/menubutton.js', 'utf8');
  assert.match(source, /this\.button = new Button\(/);
  assert.match(source, /this\.menu = new Menu\(/);
  assert.match(source, /this\._menuHoverEvents = getMenuButtonHoverEvents/);
  assert.match(source, /this\._menuHoverEvents\.enter/);
  assert.match(source, /this\._menuHoverEvents\.leave/);
  [
    'options',
    'show',
    'hide',
    'disable',
    'enable',
    'resize',
    'setText',
    'setIcon',
    'setTheme',
    'destroy'
  ].forEach(function(name) {
    assert.match(source, new RegExp('FabMenuButton\\.prototype\\.' + name + '\\s*='));
  });
  assert.doesNotMatch(source, /document\.addEventListener/);
  assert.doesNotMatch(source, /window\.addEventListener/);
});

test('MenuButton keeps icon, text and down arrow in one continuous button area', function() {
  var css = fs.readFileSync('src/menubutton/menubutton.css', 'utf8');
  assert.match(css, /\.fui-menu-button-arrow\s*\{[\s\S]*?width:\s*16px;/);
  assert.match(css, /\.fui-menu-button-arrow\s*\{[\s\S]*?border-left:\s*0;/);
  assert.doesNotMatch(css, /border-left-color/);
});
