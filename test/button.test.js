import test from 'node:test';
import assert from 'node:assert/strict';
import coreFabui from '../src/fabui.js';
import {
  normalizeButtonIconAlign,
  normalizeButtonSize,
  normalizeButtonTheme
} from '../src/button/button.js';

test('FabUI core publishes Button', function() {
  assert.equal(typeof coreFabui.Button, 'function');
});

test('Button normalizes supported themes and aliases', function() {
  assert.equal(normalizeButtonTheme('material-teal'), 'material-teal');
  assert.equal(normalizeButtonTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeButtonTheme(' BLACK '), 'black');
  assert.equal(normalizeButtonTheme('unknown'), 'default');
});

test('Button normalizes icon alignment and size', function() {
  assert.equal(normalizeButtonIconAlign('RIGHT'), 'right');
  assert.equal(normalizeButtonIconAlign('top'), 'top');
  assert.equal(normalizeButtonIconAlign('invalid'), 'left');
  assert.equal(normalizeButtonSize('LARGE'), 'large');
  assert.equal(normalizeButtonSize('medium'), 'small');
});

test('Button exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(coreFabui.Button.defaults.width, null);
  assert.equal(coreFabui.Button.defaults.height, null);
  assert.equal(coreFabui.Button.defaults.disabled, false);
  assert.equal(coreFabui.Button.defaults.toggle, false);
  assert.equal(coreFabui.Button.defaults.selected, false);
  assert.equal(coreFabui.Button.defaults.group, null);
  assert.equal(coreFabui.Button.defaults.plain, false);
  assert.equal(coreFabui.Button.defaults.text, '');
  assert.equal(coreFabui.Button.defaults.iconCls, null);
  assert.equal(coreFabui.Button.defaults.iconAlign, 'left');
  assert.equal(coreFabui.Button.defaults.size, 'small');
});
