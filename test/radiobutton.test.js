import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createRadioButtonFactory,
  normalizeRadioButtonLabelAlign,
  normalizeRadioButtonLabelPosition,
  normalizeRadioButtonTheme
} from '../src/radiobutton/radiobutton.js';

test('FabUI core publishes RadioButton as a Control', function() {
  assert.equal(typeof fabui.RadioButton, 'function');
  assert.equal(
    Object.getPrototypeOf(fabui.RadioButton.prototype),
    fabui.Control.prototype
  );
});

test('RadioButton exposes the official EasyUI-compatible defaults', function() {
  assert.equal(fabui.RadioButton.defaults.width, 20);
  assert.equal(fabui.RadioButton.defaults.height, 20);
  assert.equal(fabui.RadioButton.defaults.value, null);
  assert.equal(fabui.RadioButton.defaults.checked, false);
  assert.equal(fabui.RadioButton.defaults.disabled, false);
  assert.equal(fabui.RadioButton.defaults.label, null);
  assert.equal(fabui.RadioButton.defaults.labelWidth, 'auto');
  assert.equal(fabui.RadioButton.defaults.labelPosition, 'after');
  assert.equal(fabui.RadioButton.defaults.labelAlign, 'left');
});

test('RadioButton publishes all required locale packs', function() {
  assert.deepEqual(
    Object.keys(fabui.RadioButton.locales),
    ['en', 'zh-TW', 'zh-CN']
  );
  assert.equal(fabui.RadioButton.locales.en.radiobutton, 'Radio button');
  assert.equal(fabui.RadioButton.locales['zh-TW'].radiobutton, '選項按鈕');
  assert.equal(fabui.RadioButton.locales['zh-CN'].radiobutton, '单选按钮');
});

test('RadioButton normalizes themes, label position and label alignment', function() {
  assert.equal(normalizeRadioButtonTheme('material-teal'), 'material-teal');
  assert.equal(normalizeRadioButtonTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeRadioButtonTheme(' BLACK '), 'black');
  assert.equal(normalizeRadioButtonTheme('unknown'), 'default');
  assert.equal(normalizeRadioButtonLabelPosition('after'), 'after');
  assert.equal(normalizeRadioButtonLabelPosition('before'), 'before');
  assert.equal(normalizeRadioButtonLabelPosition('top'), 'top');
  assert.equal(normalizeRadioButtonLabelPosition(), 'after');
  assert.equal(normalizeRadioButtonLabelPosition('bottom'), 'after');
  assert.equal(normalizeRadioButtonLabelAlign('right'), 'right');
  assert.equal(normalizeRadioButtonLabelAlign('center'), 'left');
});

test('RadioButton factory exposes official methods and FabUI lifecycle', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  var RadioButton = createRadioButtonFactory(
    Control,
    function() {},
    function() {}
  );
  assert.equal(typeof RadioButton.prototype.options, 'function');
  assert.equal(typeof RadioButton.prototype.setValue, 'function');
  assert.equal(typeof RadioButton.prototype.disable, 'function');
  assert.equal(typeof RadioButton.prototype.enable, 'function');
  assert.equal(typeof RadioButton.prototype.check, 'function');
  assert.equal(typeof RadioButton.prototype.uncheck, 'function');
  assert.equal(typeof RadioButton.prototype.clear, 'function');
  assert.equal(typeof RadioButton.prototype.reset, 'function');
  assert.equal(RadioButton.prototype.dispose, RadioButton.prototype.destroy);
});

test('RadioButton source preserves native radio group and form behavior', function() {
  var source = readFileSync(
    new URL('../src/radiobutton/radiobutton.js', import.meta.url),
    'utf8'
  );
  var css = readFileSync(
    new URL('../src/radiobutton/radiobutton.css', import.meta.url),
    'utf8'
  );
  assert.match(source, /input\[type="radio"\]/);
  assert.match(source, /this\.control\.appendChild\(this\.hostElement\)/);
  assert.match(source, /this\._getGroupInputs\(\)/);
  assert.match(source, /this\.hostElement\.form/);
  assert.match(source, /registerControl\(this\.hostElement, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(source, /restoreRadioButtonAttribute/);
  assert.match(
    css,
    /\.fui-radiobutton-input:focus-visible \+ \.fui-radiobutton-box/
  );
  assert.match(css, /\.fui-radiobutton-checked \.fui-radiobutton-box::after/);
  assert.match(css, /border-radius: 50%/);
  assert.match(css, /--fui-radiobutton-accent: var\(--fui-checkbox-accent/);
});
