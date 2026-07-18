import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createMessagerFactory,
  normalizeMessagerIcon,
  normalizeMessagerLocale,
  normalizeMessagerShowType
} from '../src/messager/messager.js';

test('FabUI core publishes Messager singleton API', function() {
  assert.equal(typeof fabui.Messager, 'object');
  assert.equal(typeof fabui.Messager.alert, 'function');
  assert.equal(typeof fabui.Messager.confirm, 'function');
  assert.equal(typeof fabui.Messager.prompt, 'function');
  assert.equal(typeof fabui.Messager.show, 'function');
  assert.equal(typeof fabui.Messager.progress, 'function');
});

test('Messager exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.Messager.defaults.ok, 'Ok');
  assert.equal(fabui.Messager.defaults.cancel, 'Cancel');
  assert.equal(fabui.Messager.showDefaults.showType, 'slide');
  assert.equal(fabui.Messager.showDefaults.showSpeed, 600);
  assert.equal(fabui.Messager.showDefaults.width, 250);
  assert.equal(fabui.Messager.showDefaults.height, 100);
  assert.equal(fabui.Messager.showDefaults.timeout, 4000);
  assert.equal(fabui.Messager.progressDefaults.interval, 300);
  assert.equal(fabui.Messager.progressDefaults.value, 0);
});

test('Messager normalizes locales, alert icons and toast transitions', function() {
  assert.equal(normalizeMessagerLocale('zh-TW'), 'zh-TW');
  assert.equal(normalizeMessagerLocale('zh_cn'), 'zh-CN');
  assert.equal(normalizeMessagerLocale('fr'), 'en');
  assert.equal(normalizeMessagerIcon('WARNING'), 'warning');
  assert.equal(normalizeMessagerIcon('custom'), '');
  assert.equal(normalizeMessagerShowType('fade'), 'fade');
  assert.equal(normalizeMessagerShowType('invalid'), 'slide');
});

test('Messager factory validates shared Window and Button dependencies', function() {
  assert.throws(function() {
    createMessagerFactory(null, function Button() {});
  }, /requires fabui\.Window and fabui\.Button/);
  assert.throws(function() {
    createMessagerFactory(function Window() {}, null);
  }, /requires fabui\.Window and fabui\.Button/);
});

test('Messager source composes Window and Button without another dialog renderer', function() {
  var source = fs.readFileSync('src/messager/messager.js', 'utf8');
  assert.match(source, /state\.window = new Window\(/);
  assert.match(source, /buttons\.push\(new Button\(/);
  assert.match(source, /show:\s*showToast/);
  assert.match(source, /alert:\s*function/);
  assert.match(source, /confirm:\s*function/);
  assert.match(source, /prompt:\s*function/);
  assert.match(source, /progress:\s*function/);
  assert.match(source, /closeAll:\s*function/);
  assert.match(source, /function destroyTransientWindow\(state\)/);
  assert.match(source, /state\.host\.parentNode\.removeChild\(state\.host\)/);
  assert.match(source, /value > 100 \? 0 : value/);
  assert.match(source, /clearInterval\(state\.timer\)/);
  assert.doesNotMatch(source, /options\.fn\(value\);\s*options\.fn\(value\);/);
});

test('Messager publishes English, Traditional Chinese and Simplified Chinese labels', function() {
  assert.equal(fabui.Messager.locales.en.ok, 'Ok');
  assert.equal(fabui.Messager.locales['zh-TW'].cancel, '取消');
  assert.equal(fabui.Messager.locales['zh-CN'].confirm, '确认');
});
