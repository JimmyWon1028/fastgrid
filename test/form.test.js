import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  appendFormQuery,
  createFormFactory,
  normalizeFormLocale,
  normalizeFormMethod,
  normalizeFormTheme
} from '../src/form/form.js';

test('FabUI core publishes Form as a Control', function() {
  assert.equal(typeof fabui.Form, 'function');
  assert.equal(Object.getPrototypeOf(fabui.Form.prototype), fabui.Control.prototype);
});

test('Form exposes the official EasyUI-compatible defaults', function() {
  assert.equal(fabui.Form.defaults.novalidate, false);
  assert.equal(fabui.Form.defaults.iframe, true);
  assert.equal(fabui.Form.defaults.ajax, true);
  assert.equal(fabui.Form.defaults.dirty, false);
  assert.deepEqual(fabui.Form.defaults.queryParams, {});
  assert.equal(fabui.Form.defaults.url, null);
  assert.equal(fabui.Form.defaults.locale, 'en');
  assert.equal(fabui.Form.defaults.theme, 'inherit');
  assert.equal(fabui.Form.themes.length, 19);
  assert.equal(fabui.Form.locales['zh-TW'].valueMissing, '此欄位為必填。');
  assert.equal(fabui.Form.locales['zh-CN'].valueMissing, '此字段为必填项。');
});

test('Form factory publishes the official API and FabUI lifecycle methods', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  Control.getControl = function() {
    return null;
  };
  function EditBox() {}
  EditBox.getControl = function() {
    return null;
  };
  var Form = createFormFactory(
    Control,
    function() {},
    function() {},
    EditBox
  );
  [
    'submit',
    'load',
    'clear',
    'reset',
    'validate',
    'enableValidation',
    'disableValidation',
    'resetValidation',
    'setLocale',
    'setTheme',
    'resetDirty',
    'options',
    'setOptions',
    'getData',
    'isDirty',
    'on',
    'off',
    'destroy',
    'dispose'
  ].forEach(function(name) {
    assert.equal(typeof Form.prototype[name], 'function', name);
  });
  assert.equal(Form.prototype.dispose, Form.prototype.destroy);
});

test('Form query helpers preserve arrays, hashes and normalized methods', function() {
  assert.equal(
    appendFormQuery('/api/form?source=demo#result', {
      tag: ['one', 'two'],
      empty: null
    }),
    '/api/form?source=demo&tag=one&tag=two&empty=#result'
  );
  assert.equal(normalizeFormMethod('post'), 'POST');
  assert.equal(normalizeFormMethod(' PATCH '), 'PATCH');
  assert.equal(normalizeFormMethod(''), 'GET');
  assert.equal(normalizeFormMethod('get now'), 'GET');
  assert.equal(normalizeFormLocale('zh-Hant'), 'zh-TW');
  assert.equal(normalizeFormLocale('zh-TW'), 'zh-TW');
  assert.equal(normalizeFormLocale('zh-Hans'), 'zh-CN');
  assert.equal(normalizeFormLocale('zh-CN'), 'zh-CN');
  assert.equal(normalizeFormLocale('fr'), 'en');
  assert.equal(normalizeFormTheme('dark-hive'), 'dark-hive');
  assert.equal(normalizeFormTheme('pepper'), 'pepper-grinder');
});

test('Form source integrates native fields, FabUI controls and XHR lifecycle', function() {
  var source = readFileSync(new URL('../src/form/form.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/form/form.css', import.meta.url), 'utf8');
  var build = readFileSync(new URL('../build/build.cjs', import.meta.url), 'utf8');
  assert.match(source, /fabui\.Form requires a form element/);
  assert.match(source, /new FormData\(this\.hostElement\)/);
  assert.match(source, /EditBox\.getControl/);
  assert.match(source, /Control\.getControl/);
  assert.match(source, /HTMLFormElement\.prototype\.submit\.call/);
  assert.match(source, /xhr\.upload\.addEventListener\('progress'/);
  assert.match(source, /registerControl\(host, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(css, /\.fui-form \.fui-form-invalid/);
  assert.match(css, /\.fui-form \.fui-form-invalid-control/);
  assert.match(css, /\.fui-radiobutton-control\.fui-form-invalid-control/);
  assert.match(css, /\.fui-radiogroup\.fui-form-invalid-control/);
  assert.match(css, /\.fui-form-validation-tip/);
  assert.match(css, /--fui-form-validation-tip-border,\s*#e6d38a/);
  assert.match(css, /--fui-form-validation-tip-bg,\s*#fff8d6/);
  assert.match(css, /--fui-form-validation-tip-text,\s*#111827/);
  assert.match(source, /validity\.valueMissing/);
  assert.match(source, /typeMismatchEmail/);
  assert.match(source, /此欄位為必填。/);
  assert.match(source, /此字段为必填项。/);
  assert.match(source, /\.fui-radiobutton-control, \.fui-radiogroup/);
  assert.match(source, /container\.classList\.add\('fui-form-invalid-control'\)/);
  assert.doesNotMatch(
    source,
    /\.fui-textbox-field,[\s\S]*?\.fui-editbox/
  );
  assert.doesNotMatch(css, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
  assert.match(build, /global\.fabui\.Form = createFormFactory/);
});
