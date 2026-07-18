import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import fabui from '../src/fabui.js';
import { createSplitButtonFactory } from '../src/splitbutton/splitbutton.js';

test('FabUI core publishes SplitButton', function() {
  assert.equal(typeof fabui.SplitButton, 'function');
});

test('SplitButton exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.SplitButton.defaults.plain, true);
  assert.equal(fabui.SplitButton.defaults.menu, null);
  assert.equal(fabui.SplitButton.defaults.duration, 100);
  assert.equal(fabui.SplitButton.defaults.iconAlign, 'left');
});

test('SplitButton factory validates the shared MenuButton dependency', function() {
  function Control() {}
  assert.throws(function() {
    createSplitButtonFactory(Control, function() {}, function() {}, null);
  }, /requires fabui\.MenuButton/);
  assert.equal(typeof createSplitButtonFactory(
    Control,
    function() {},
    function() {},
    function MenuButton() {}
  ), 'function');
});

test('SplitButton composes MenuButton and keeps main and arrow actions separate', function() {
  var source = fs.readFileSync('src/splitbutton/splitbutton.js', 'utf8');
  assert.match(source, /this\.menuButton = new MenuButton\(/);
  assert.match(source, /hideEvent:\s*'mouseleave'/);
  assert.match(source, /this\.menuButton\.button\.off\('click', this\.menuButton\._onTriggerClick\)/);
  assert.match(source, /self\._fire\('ArrowClick'/);
  assert.match(source, /self\._fire\('Click'/);
  assert.match(source, /this\.arrowElement, 'pointerenter'/);
  assert.match(source, /this\.menu\.hostElement, 'keydown', this\._onMenuKeyDown/);
  assert.match(source, /self\.hostElement\.focus\(\)/);
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
    assert.match(source, new RegExp('FabSplitButton\\.prototype\\.' + name + '\\s*='));
  });
  assert.doesNotMatch(source, /new Button\(/);
  assert.doesNotMatch(source, /new Menu\(/);
  assert.doesNotMatch(source, /document\.addEventListener/);
  assert.doesNotMatch(source, /window\.addEventListener/);
});

test('SplitButton shows its arrow divider only while the button is hovered', function() {
  var css = fs.readFileSync('src/splitbutton/splitbutton.css', 'utf8');
  assert.match(css, /\.fui-split-button \.fui-split-button-arrow\s*\{[\s\S]*?width:\s*22px;/);
  assert.match(css, /\.fui-split-button \.fui-split-button-arrow\s*\{[\s\S]*?border-left:\s*1px solid transparent;/);
  assert.match(css, /\.fui-split-button:not\(\.fui-button-disabled\):hover \.fui-split-button-arrow\s*\{[\s\S]*?border-left-color:\s*rgba\(0,\s*0,\s*0,\s*0\.12\);/);
});
