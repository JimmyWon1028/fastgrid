import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createCheckBoxFactory,
  normalizeCheckBoxLabelAlign,
  normalizeCheckBoxLabelPosition,
  normalizeCheckBoxTheme
} from '../src/checkbox/checkbox.js';

test('FabUI core publishes CheckBox as a Control', function() {
  assert.equal(typeof fabui.CheckBox, 'function');
  assert.equal(Object.getPrototypeOf(fabui.CheckBox.prototype), fabui.Control.prototype);
});

test('CheckBox exposes the official EasyUI-compatible defaults', function() {
  assert.equal(fabui.CheckBox.defaults.width, 20);
  assert.equal(fabui.CheckBox.defaults.height, 20);
  assert.equal(fabui.CheckBox.defaults.value, null);
  assert.equal(fabui.CheckBox.defaults.checked, false);
  assert.equal(fabui.CheckBox.defaults.disabled, false);
  assert.equal(fabui.CheckBox.defaults.label, null);
  assert.equal(fabui.CheckBox.defaults.labelWidth, 'auto');
  assert.equal(fabui.CheckBox.defaults.labelPosition, 'after');
  assert.equal(fabui.CheckBox.defaults.labelAlign, 'left');
});

test('CheckBox publishes all required locale packs', function() {
  assert.deepEqual(Object.keys(fabui.CheckBox.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.CheckBox.locales.en.checkbox, 'Checkbox');
  assert.equal(fabui.CheckBox.locales['zh-TW'].checkbox, '核取方塊');
  assert.equal(fabui.CheckBox.locales['zh-CN'].checkbox, '复选框');
});

test('CheckBox normalizes themes, label position and label alignment', function() {
  assert.equal(normalizeCheckBoxTheme('material-teal'), 'material-teal');
  assert.equal(normalizeCheckBoxTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeCheckBoxTheme(' BLACK '), 'black');
  assert.equal(normalizeCheckBoxTheme('unknown'), 'default');
  assert.equal(normalizeCheckBoxLabelPosition('after'), 'after');
  assert.equal(normalizeCheckBoxLabelPosition('before'), 'before');
  assert.equal(normalizeCheckBoxLabelPosition('top'), 'top');
  assert.equal(normalizeCheckBoxLabelPosition(), 'after');
  assert.equal(normalizeCheckBoxLabelPosition('bottom'), 'after');
  assert.equal(normalizeCheckBoxLabelAlign('right'), 'right');
  assert.equal(normalizeCheckBoxLabelAlign('center'), 'left');
});

test('CheckBox factory exposes official methods and FabUI lifecycle', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  var CheckBox = createCheckBoxFactory(Control, function() {}, function() {});
  assert.equal(typeof CheckBox, 'function');
  assert.equal(CheckBox.normalizeTheme('sunny'), 'sunny');
  assert.equal(typeof CheckBox.prototype.options, 'function');
  assert.equal(typeof CheckBox.prototype.setValue, 'function');
  assert.equal(typeof CheckBox.prototype.disable, 'function');
  assert.equal(typeof CheckBox.prototype.enable, 'function');
  assert.equal(typeof CheckBox.prototype.check, 'function');
  assert.equal(typeof CheckBox.prototype.uncheck, 'function');
  assert.equal(typeof CheckBox.prototype.clear, 'function');
  assert.equal(typeof CheckBox.prototype.reset, 'function');
  assert.equal(CheckBox.prototype.dispose, CheckBox.prototype.destroy);
});

test('CheckBox source preserves native input and form behavior', function() {
  var source = readFileSync(new URL('../src/checkbox/checkbox.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/checkbox/checkbox.css', import.meta.url), 'utf8');
  assert.match(source, /input\[type="checkbox"\]/);
  assert.match(source, /this\.control\.appendChild\(this\.hostElement\)/);
  assert.match(source, /this\.hostElement\.form/);
  assert.match(source, /registerControl\(this\.hostElement, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(source, /restoreCheckBoxAttribute/);
  assert.match(css, /\.fui-checkbox-input:focus-visible \+ \.fui-checkbox-box/);
  assert.match(css, /\.fui-checkbox-checked \.fui-checkbox-box,/);
  assert.match(css, /background: var\(--fui-checkbox-accent\)/);
  assert.match(css, /\.fui-checkbox-checked \.fui-checkbox-box::after/);
  assert.match(css, /@media \(forced-colors: active\)/);
});
