import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, '..');
const distDir = path.join(root, 'dist');
function getLiteOutputPath(extension) {
  const regular = path.join(distDir, 'fabui.lite.' + extension);
  return fs.existsSync(regular) ? regular : path.join(distDir, 'fabui.lite.min.' + extension);
}
const excludedApis = [
  'Accordion',
  'Button',
  'Calendar',
  'CheckBox',
  'CheckGroup',
  'Diagram',
  'EditBox',
  'FileBox',
  'Form',
  'Layout',
  'Menu',
  'MenuButton',
  'Messager',
  'Panel',
  'PropertyGrid',
  'RadioButton',
  'RadioGroup',
  'SplitButton',
  'SwitchButton',
  'Tabs',
  'Tooltip',
  'Tree',
  'Window'
];

test('FabUI Lite browser bundle publishes FabGrid with TreeGrid, Pivot, Chart and shared dependencies', function() {
  const source = fs.readFileSync(getLiteOutputPath('js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);

  assert.equal(typeof context.fabui.FabGrid, 'function');
  assert.equal(typeof context.fabui.Chart, 'function');
  assert.equal(typeof context.fabui.Control, 'function');
  assert.equal(typeof context.fabui.FabGrid.prototype.isTreeGrid, 'function');
  assert.equal(typeof context.fabui.FabGrid.prototype.setChildItemsPath, 'function');
  assert.equal(typeof context.fabui.FabGrid.prototype.expandAllTreeNodes, 'function');
  assert.equal(typeof context.fabui.pivot.PivotEngine, 'function');
  assert.equal(typeof context.fabui.pivot.PivotGrid, 'function');
  assert.equal(typeof context.fabui.pivot.PivotChart, 'function');
  excludedApis.forEach(function(name) {
    assert.equal(context.fabui[name], undefined, name + ' must not be published by FabUI Lite');
  });
});

test('FabUI Lite CSS excludes unrelated component styles', function() {
  const css = fs.readFileSync(getLiteOutputPath('css'), 'utf8');

  assert.match(css, /\.fg-root/);
  assert.match(css, /\.fg-pivot-workspace/);
  assert.match(css, /\.fui-chart/);
  assert.doesNotMatch(css, /\.fui-diagram/);
  assert.doesNotMatch(css, /\.fui-window/);
  assert.doesNotMatch(css, /\.fui-menu(?:\s|\{|\.)/);
  assert.doesNotMatch(css, /\.fui-button(?:\s|\{|\.)/);
  assert.doesNotMatch(css, /\.fui-tabs/);
});
