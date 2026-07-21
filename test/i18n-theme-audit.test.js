import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';

var locales = ['en', 'zh-TW', 'zh-CN'];
var themes = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function assertLocalePack(componentName, component) {
  var packs = component.locales;
  var expectedKeys;
  assert.ok(packs, componentName + ' locales');
  assert.deepEqual(Object.keys(packs), locales, componentName + ' locale names');
  expectedKeys = Object.keys(packs.en).sort();
  locales.forEach(function(locale) {
    var pack = packs[locale];
    assert.deepEqual(
      Object.keys(pack).sort(),
      expectedKeys,
      componentName + ' ' + locale + ' keys'
    );
    expectedKeys.forEach(function(key) {
      var value = pack[key];
      assert.ok(
        Array.isArray(value) ? value.length > 0 : String(value || '').length > 0,
        componentName + ' ' + locale + '.' + key
      );
    });
  });
}

test('Every localized public component publishes complete en, zh-TW and zh-CN packs', function() {
  [
    'Calendar', 'Chart', 'CheckBox', 'CheckGroup', 'Diagram', 'EditBox', 'FileBox',
    'Form', 'Layout', 'Menu', 'Panel', 'PropertyGrid', 'RadioButton',
    'RadioGroup', 'SwitchButton', 'Tabs', 'Tree', 'Window'
  ].forEach(function(name) {
    assertLocalePack(name, fabui[name]);
  });
  assertLocalePack('Messager', fabui.Messager);
});

test('Localized public components normalize Traditional and Simplified Chinese aliases', function() {
  [
    fabui.Calendar,
    fabui.Chart,
    fabui.CheckBox,
    fabui.CheckGroup,
    fabui.Diagram,
    fabui.FabGrid,
    fabui.FileBox,
    fabui.Form,
    fabui.Layout,
    fabui.Menu,
    fabui.Messager,
    fabui.Panel,
    fabui.PropertyGrid,
    fabui.RadioButton,
    fabui.RadioGroup,
    fabui.SwitchButton,
    fabui.Tabs,
    fabui.Tree,
    fabui.Window
  ].forEach(function(component) {
    assert.equal(component.normalizeLocale('zh-Hant'), 'zh-TW');
    assert.equal(component.normalizeLocale('zh_Hant_TW'), 'zh-TW');
    assert.equal(component.normalizeLocale('zh-Hans'), 'zh-CN');
    assert.equal(component.normalizeLocale('zh_CN'), 'zh-CN');
    assert.equal(component.normalizeLocale('en-US'), 'en');
  });
});

test('Every theme-aware public component publishes the same 19-theme contract', function() {
  [
    'Button', 'Calendar', 'Chart', 'CheckBox', 'CheckGroup', 'Diagram', 'EditBox',
    'FabGrid', 'FileBox', 'Form', 'Layout', 'Menu', 'MenuButton', 'Panel',
    'PropertyGrid', 'RadioButton', 'RadioGroup', 'SplitButton', 'Tabs',
    'SwitchButton', 'Tree', 'Tooltip', 'Window'
  ].forEach(function(name) {
    assert.deepEqual(fabui[name].themes, themes, name);
  });
  assert.deepEqual(fabui.Messager.themes, themes, 'Messager');
  [
    'PivotChart', 'PivotGrid', 'PivotPanel', 'PivotSlicer', 'PivotWorkspace'
  ].forEach(function(name) {
    assert.deepEqual(fabui.pivot[name].themes, themes, name);
  });
});

test('Detached Form, ComboBox and ColorBox popups carry their active theme', function() {
  var formSource = readFileSync(
    new URL('../src/form/form.js', import.meta.url),
    'utf8'
  );
  var comboSource = readFileSync(
    new URL('../src/editbox/combo-popup.js', import.meta.url),
    'utf8'
  );
  var colorSource = readFileSync(
    new URL('../src/editbox/color-popup.js', import.meta.url),
    'utf8'
  );
  assert.match(formSource, /this\._applyThemeClass\(tip\)/);
  assert.match(formSource, /Form\.prototype\.setTheme/);
  assert.match(comboSource, /ComboPopup\.prototype\.setTheme/);
  assert.match(comboSource, /this\.setTheme\(this\.options\.theme\)/);
  assert.match(colorSource, /ColorPopup\.prototype\.setTheme/);
  assert.match(colorSource, /this\.setTheme\(this\.options\.theme\)/);
});

test('Chart and Form visual states consume their public theme variables', function() {
  var chartCss = readFileSync(
    new URL('../src/chart/chart.css', import.meta.url),
    'utf8'
  );
  var formCss = readFileSync(
    new URL('../src/form/form.css', import.meta.url),
    'utf8'
  );
  var colorCss = readFileSync(
    new URL('../src/editbox/color-editbox.css', import.meta.url),
    'utf8'
  );
  assert.match(chartCss, /var\(--fui-panel-bg/);
  assert.match(chartCss, /var\(--fui-panel-text/);
  assert.match(chartCss, /var\(--fui-propertygrid-border/);
  assert.match(chartCss, /var\(--fui-control-selected/);
  assert.match(formCss, /var\(--fui-form-validation-tip-bg/);
  assert.match(formCss, /var\(--fui-form-validation-tip-text/);
  assert.match(colorCss, /background:\s*var\(--fui-panel-bg/);
  assert.match(colorCss, /color:\s*var\(--fui-panel-text/);
});

test('FabGrid pagination aria label comes from the active locale', function() {
  var gridSource = readFileSync(
    new URL('../src/grid/fabgrid.js', import.meta.url),
    'utf8'
  );
  var viewSource = readFileSync(
    new URL('../src/grid/fabgrid-view.js', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(gridSource, /aria-label="Pagination"/);
  assert.match(
    viewSource,
    /setAttribute\('aria-label', this\.getText\('pagination\.ariaLabel'\)\)/
  );
});
