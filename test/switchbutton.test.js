import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createSwitchButtonFactory,
  normalizeSwitchButtonLabelAlign,
  normalizeSwitchButtonLabelPosition,
  normalizeSwitchButtonTheme
} from '../src/switchbutton/switchbutton.js';

var themePalettes = {
  default: ['#bbb', '#ffe48d', '#000', '#fff', '#000', '5px', '14px'],
  bootstrap: ['#bbb', '#0081c2', '#fff', '#fff', '#333', '5px', '12px'],
  cupertino: ['#aed0ea', '#3baae3', '#fff', '#f2f5f7', '#000', '5px', '14px'],
  material: ['#d9d9d9', '#00bbee', '#fff', '#fff', '#404040', '4px', '14px'],
  'material-blue': ['#2196f3', '#eee', '#2196f3', '#fff', '#404040', '2px', '14px'],
  'material-teal': ['#dfdfdf', '#eee', '#39c', '#fff', '#404040', '4px', '14px'],
  metro: ['#ddd', '#cce6ff', '#000', '#fff', '#444', '0', '14px'],
  'metro-blue': ['#1a7bc9', '#6caef5', '#fff', '#fafafa', '#404040', '0', '14px'],
  'metro-gray': ['#84909c', '#84909c', '#fff', '#fafafa', '#404040', '0', '14px'],
  'metro-green': ['#9ba842', '#c8d47b', '#404040', '#fafafa', '#404040', '0', '14px'],
  'metro-orange': ['#de8033', '#f7cc8f', '#404040', '#fafafa', '#404040', '0', '14px'],
  'metro-red': ['#c75252', '#f09090', '#404040', '#fafafa', '#404040', '0', '14px'],
  sunny: ['#d19405', '#fff', '#0074c7', '#feeebd', '#000', '5px', '14px'],
  'pepper-grinder': ['#cbc7bd', '#b83400', '#fff', '#eceadf', '#1f1f1f', '5px', '14px'],
  'dark-hive': ['#444', '#0972a5', '#fff', '#000', '#fff', '5px', '14px'],
  black: ['#555', '#0052a3', '#fff', '#666', '#fff', '5px', '14px']
};

test('FabUI core publishes SwitchButton as a Control', function() {
  assert.equal(typeof fabui.SwitchButton, 'function');
  assert.equal(
    Object.getPrototypeOf(fabui.SwitchButton.prototype),
    fabui.Control.prototype
  );
});

test('SwitchButton exposes the local EasyUI 1.11.5 defaults', function() {
  assert.equal(fabui.SwitchButton.defaults.width, 60);
  assert.equal(fabui.SwitchButton.defaults.height, 30);
  assert.equal(fabui.SwitchButton.defaults.handleWidth, 'auto');
  assert.equal(fabui.SwitchButton.defaults.checked, false);
  assert.equal(fabui.SwitchButton.defaults.disabled, false);
  assert.equal(fabui.SwitchButton.defaults.readonly, false);
  assert.equal(fabui.SwitchButton.defaults.reversed, false);
  assert.equal(fabui.SwitchButton.defaults.onText, 'ON');
  assert.equal(fabui.SwitchButton.defaults.offText, 'OFF');
  assert.equal(fabui.SwitchButton.defaults.handleText, '');
  assert.equal(fabui.SwitchButton.defaults.value, 'on');
  assert.equal(fabui.SwitchButton.defaults.label, null);
  assert.equal(fabui.SwitchButton.defaults.labelWidth, 'auto');
  assert.equal(fabui.SwitchButton.defaults.labelPosition, 'before');
  assert.equal(fabui.SwitchButton.defaults.labelAlign, 'left');
});

test('SwitchButton publishes all required locale packs and themes', function() {
  assert.deepEqual(
    Object.keys(fabui.SwitchButton.locales),
    ['en', 'zh-TW', 'zh-CN']
  );
  assert.equal(fabui.SwitchButton.locales.en.switchbutton, 'Switch button');
  assert.equal(fabui.SwitchButton.locales['zh-TW'].switchbutton, '切換按鈕');
  assert.equal(fabui.SwitchButton.locales['zh-CN'].switchbutton, '切换按钮');
  assert.deepEqual(
    fabui.SwitchButton.themes.slice().sort(),
    Object.keys(themePalettes).concat('mono', 'mono-red', 'mono-green').sort()
  );
});

test('SwitchButton normalizes themes and label layout options', function() {
  assert.equal(normalizeSwitchButtonTheme('metro-green'), 'metro-green');
  assert.equal(normalizeSwitchButtonTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeSwitchButtonTheme(' BLACK '), 'black');
  assert.equal(normalizeSwitchButtonTheme('mono'), 'mono');
  assert.equal(normalizeSwitchButtonTheme('mono-red'), 'mono-red');
  assert.equal(normalizeSwitchButtonTheme('mono-green'), 'mono-green');
  assert.equal(normalizeSwitchButtonTheme('unknown'), 'default');
  assert.equal(normalizeSwitchButtonLabelPosition('after'), 'after');
  assert.equal(normalizeSwitchButtonLabelPosition('top'), 'top');
  assert.equal(normalizeSwitchButtonLabelPosition('bottom'), 'before');
  assert.equal(normalizeSwitchButtonLabelAlign('right'), 'right');
  assert.equal(normalizeSwitchButtonLabelAlign('center'), 'left');
});

test('SwitchButton exposes the official methods and FabUI lifecycle', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  var SwitchButton = createSwitchButtonFactory(
    Control,
    function() {},
    function() {}
  );
  [
    'options', 'resize', 'disable', 'enable', 'readonly', 'check',
    'uncheck', 'clear', 'reset', 'setValue', 'setOptions', 'setTheme',
    'setLocale', 'destroy', 'dispose'
  ].forEach(function(name) {
    assert.equal(typeof SwitchButton.prototype[name], 'function', name);
  });
  assert.equal(SwitchButton.prototype.dispose, SwitchButton.prototype.destroy);
});

test('SwitchButton preserves the native checkbox and form lifecycle', function() {
  var source = readFileSync(
    new URL('../src/switchbutton/switchbutton.js', import.meta.url),
    'utf8'
  );
  var css = readFileSync(
    new URL('../src/switchbutton/switchbutton.css', import.meta.url),
    'utf8'
  );
  assert.match(source, /input\[type="checkbox"\]/);
  assert.match(source, /this\.control\.appendChild\(this\.hostElement\)/);
  assert.match(source, /this\.hostElement\.form/);
  assert.match(source, /registerControl\(this\.hostElement, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(source, /restoreSwitchButtonAttribute/);
  assert.match(css, /\.fui-switchbutton-inner/);
  assert.match(css, /transition: margin-left 200ms ease/);
  assert.doesNotMatch(css, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});

test('SwitchButton maps every theme to its local res switchbutton palette', function() {
  var baseCss = readFileSync(
    new URL('../src/switchbutton/switchbutton.css', import.meta.url),
    'utf8'
  ).toLowerCase();
  Object.keys(themePalettes).forEach(function(theme) {
    var css = theme === 'default' ? baseCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    ).toLowerCase();
    var match = Array.from(css.matchAll(/\.fui-switchbutton\s*\{([^}]*)\}/g))
      .find(function(entry) {
        return entry[1].includes(themePalettes[theme][0]);
      });
    assert.ok(match, theme);
    themePalettes[theme].forEach(function(value) {
      assert.ok(match[1].includes(value), theme + ' ' + value);
    });
  });
});
