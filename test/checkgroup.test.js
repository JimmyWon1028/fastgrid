import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createCheckGroupFactory,
  normalizeCheckGroupData,
  normalizeCheckGroupDirection,
  normalizeCheckGroupLabelAlign,
  normalizeCheckGroupLabelPosition,
  normalizeCheckGroupTheme
} from '../src/checkgroup/checkgroup.js';

test('FabUI core publishes CheckGroup as a Control', function() {
  assert.equal(typeof fabui.CheckGroup, 'function');
  assert.equal(Object.getPrototypeOf(fabui.CheckGroup.prototype), fabui.Control.prototype);
});

test('CheckGroup exposes the official EasyUI-compatible defaults', function() {
  assert.equal(fabui.CheckGroup.defaults.name, '');
  assert.deepEqual(fabui.CheckGroup.defaults.value, []);
  assert.deepEqual(fabui.CheckGroup.defaults.data, []);
  assert.equal(fabui.CheckGroup.defaults.dir, 'h');
  assert.deepEqual(fabui.CheckGroup.defaults.itemStyle, { height: 30 });
  assert.equal(fabui.CheckGroup.defaults.labelWidth, 'auto');
  assert.equal(fabui.CheckGroup.defaults.labelPosition, 'after');
  assert.equal(fabui.CheckGroup.defaults.labelAlign, 'left');
});

test('CheckGroup normalizes data without mutating source items', function() {
  var source = [
    { value: '1', label: 'Item1' },
    { value: '2', label: 'Item2', disabled: true },
    '3'
  ];
  var result = normalizeCheckGroupData(source);
  assert.deepEqual(result, [
    { value: '1', label: 'Item1', disabled: false },
    { value: '2', label: 'Item2', disabled: true },
    { value: '3', label: '3', disabled: false }
  ]);
  assert.equal(Object.prototype.hasOwnProperty.call(source[0], 'disabled'), false);
});

test('CheckGroup normalizes direction, labels and themes', function() {
  assert.equal(normalizeCheckGroupDirection('V'), 'v');
  assert.equal(normalizeCheckGroupDirection('grid'), 'h');
  assert.equal(normalizeCheckGroupLabelPosition(), 'after');
  assert.equal(normalizeCheckGroupLabelPosition('before'), 'before');
  assert.equal(normalizeCheckGroupLabelPosition('top'), 'after');
  assert.equal(normalizeCheckGroupLabelAlign('RIGHT'), 'right');
  assert.equal(normalizeCheckGroupLabelAlign('center'), 'left');
  assert.equal(normalizeCheckGroupTheme('material-teal'), 'material-teal');
  assert.equal(normalizeCheckGroupTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeCheckGroupTheme('unknown'), 'default');
});

test('CheckGroup publishes all required locale packs', function() {
  assert.deepEqual(Object.keys(fabui.CheckGroup.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.CheckGroup.locales.en.group, 'Checkbox group');
  assert.equal(fabui.CheckGroup.locales['zh-TW'].group, '核取方塊群組');
  assert.equal(fabui.CheckGroup.locales['zh-CN'].group, '复选框组');
});

test('CheckGroup factory exposes official and FabUI lifecycle methods', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  function CheckBox() {}
  var CheckGroup = createCheckGroupFactory(
    Control,
    function() {},
    function() {},
    CheckBox
  );
  assert.equal(typeof CheckGroup.prototype.options, 'function');
  assert.equal(typeof CheckGroup.prototype.setValue, 'function');
  assert.equal(typeof CheckGroup.prototype.getValue, 'function');
  assert.equal(typeof CheckGroup.prototype.getData, 'function');
  assert.equal(typeof CheckGroup.prototype.getCheckBox, 'function');
  assert.equal(typeof CheckGroup.prototype.loadData, 'function');
  assert.equal(typeof CheckGroup.prototype.check, 'function');
  assert.equal(typeof CheckGroup.prototype.uncheck, 'function');
  assert.equal(typeof CheckGroup.prototype.clear, 'function');
  assert.equal(typeof CheckGroup.prototype.reset, 'function');
  assert.equal(typeof CheckGroup.prototype.disable, 'function');
  assert.equal(typeof CheckGroup.prototype.enable, 'function');
  assert.equal(CheckGroup.prototype.dispose, CheckGroup.prototype.destroy);
});

test('CheckGroup source composes CheckBox and preserves native form fields', function() {
  var source = readFileSync(new URL('../src/checkgroup/checkgroup.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/checkgroup/checkgroup.css', import.meta.url), 'utf8');
  assert.match(source, /new CheckBox\(input/);
  assert.match(source, /input\.type = 'checkbox'/);
  assert.match(source, /input\.name = self\._options\.name/);
  assert.match(source, /record\.control\.isChecked\(\)/);
  assert.match(source, /registerControl\(host, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(css, /\.fui-checkgroup-h/);
  assert.match(css, /\.fui-checkgroup-v/);
  assert.match(css, /--fui-checkgroup-text: var\(--fui-control-label-text/);
});
