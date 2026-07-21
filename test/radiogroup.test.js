import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createRadioGroupFactory,
  normalizeRadioGroupData,
  normalizeRadioGroupDirection,
  normalizeRadioGroupLabelAlign,
  normalizeRadioGroupLabelPosition,
  normalizeRadioGroupTheme
} from '../src/radiogroup/radiogroup.js';

test('FabUI core publishes RadioGroup as a Control', function() {
  assert.equal(typeof fabui.RadioGroup, 'function');
  assert.equal(
    Object.getPrototypeOf(fabui.RadioGroup.prototype),
    fabui.Control.prototype
  );
});

test('RadioGroup exposes the official EasyUI-compatible defaults', function() {
  assert.equal(fabui.RadioGroup.defaults.name, '');
  assert.equal(fabui.RadioGroup.defaults.value, null);
  assert.deepEqual(fabui.RadioGroup.defaults.data, []);
  assert.equal(fabui.RadioGroup.defaults.dir, 'h');
  assert.deepEqual(fabui.RadioGroup.defaults.itemStyle, { height: 30 });
  assert.equal(fabui.RadioGroup.defaults.labelWidth, 'auto');
  assert.equal(fabui.RadioGroup.defaults.labelPosition, 'after');
  assert.equal(fabui.RadioGroup.defaults.labelAlign, 'left');
});

test('RadioGroup normalizes data without mutating source items', function() {
  var source = [
    { value: '1', label: 'Item1' },
    { value: '2', label: 'Item2', disabled: true },
    '3'
  ];
  var result = normalizeRadioGroupData(source);
  assert.deepEqual(result, [
    { value: '1', label: 'Item1', disabled: false },
    { value: '2', label: 'Item2', disabled: true },
    { value: '3', label: '3', disabled: false }
  ]);
  assert.equal(Object.prototype.hasOwnProperty.call(source[0], 'disabled'), false);
});

test('RadioGroup normalizes direction, labels and themes', function() {
  assert.equal(normalizeRadioGroupDirection('V'), 'v');
  assert.equal(normalizeRadioGroupDirection('grid'), 'h');
  assert.equal(normalizeRadioGroupLabelPosition(), 'after');
  assert.equal(normalizeRadioGroupLabelPosition('before'), 'before');
  assert.equal(normalizeRadioGroupLabelPosition('top'), 'after');
  assert.equal(normalizeRadioGroupLabelAlign('RIGHT'), 'right');
  assert.equal(normalizeRadioGroupLabelAlign('center'), 'left');
  assert.equal(normalizeRadioGroupTheme('material-teal'), 'material-teal');
  assert.equal(normalizeRadioGroupTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeRadioGroupTheme('unknown'), 'default');
});

test('RadioGroup publishes all required locale packs', function() {
  assert.deepEqual(
    Object.keys(fabui.RadioGroup.locales),
    ['en', 'zh-TW', 'zh-CN']
  );
  assert.equal(fabui.RadioGroup.locales.en.group, 'Radio group');
  assert.equal(fabui.RadioGroup.locales['zh-TW'].group, '單選群組');
  assert.equal(fabui.RadioGroup.locales['zh-CN'].group, '单选组');
});

test('RadioGroup factory exposes official and FabUI lifecycle methods', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  function RadioButton() {}
  var RadioGroup = createRadioGroupFactory(
    Control,
    function() {},
    function() {},
    RadioButton
  );
  assert.equal(typeof RadioGroup.prototype.options, 'function');
  assert.equal(typeof RadioGroup.prototype.setValue, 'function');
  assert.equal(typeof RadioGroup.prototype.getValue, 'function');
  assert.equal(typeof RadioGroup.prototype.getData, 'function');
  assert.equal(typeof RadioGroup.prototype.getRadioButton, 'function');
  assert.equal(typeof RadioGroup.prototype.loadData, 'function');
  assert.equal(typeof RadioGroup.prototype.clear, 'function');
  assert.equal(typeof RadioGroup.prototype.reset, 'function');
  assert.equal(typeof RadioGroup.prototype.disable, 'function');
  assert.equal(typeof RadioGroup.prototype.enable, 'function');
  assert.equal(RadioGroup.prototype.dispose, RadioGroup.prototype.destroy);
});

test('RadioGroup source composes RadioButton and preserves native form fields', function() {
  var source = readFileSync(
    new URL('../src/radiogroup/radiogroup.js', import.meta.url),
    'utf8'
  );
  var css = readFileSync(
    new URL('../src/radiogroup/radiogroup.css', import.meta.url),
    'utf8'
  );
  assert.match(source, /new RadioButton\(input/);
  assert.match(source, /input\.type = 'radio'/);
  assert.match(source, /input\.name = self\._options\.name/);
  assert.match(source, /item\.control\.isChecked\(\)/);
  assert.match(source, /registerControl\(host, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(css, /\.fui-radiogroup-h/);
  assert.match(css, /\.fui-radiogroup-v/);
  assert.match(
    css,
    /--fui-radiogroup-text: var\(--fui-control-label-text/
  );
});
