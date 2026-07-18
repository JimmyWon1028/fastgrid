import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createTreeFactory,
  flattenTreeData,
  moveTreeDataNode,
  normalizeTreeData,
  normalizeTreeTheme
} from '../src/tree/tree.js';

test('FabUI core publishes Tree', function() {
  assert.equal(typeof fabui.Tree, 'function');
  assert.equal(Object.getPrototypeOf(fabui.Tree.prototype), fabui.Control.prototype);
});

test('Tree exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.Tree.defaults.url, null);
  assert.equal(fabui.Tree.defaults.method, 'post');
  assert.equal(fabui.Tree.defaults.animate, false);
  assert.equal(fabui.Tree.defaults.checkbox, false);
  assert.equal(fabui.Tree.defaults.cascadeCheck, true);
  assert.equal(fabui.Tree.defaults.onlyLeafCheck, false);
  assert.equal(fabui.Tree.defaults.lines, false);
  assert.equal(fabui.Tree.defaults.dnd, false);
  assert.equal(fabui.Tree.defaults.data, null);
  assert.deepEqual(fabui.Tree.defaults.queryParams, {});
});

test('Tree publishes all required locale packs', function() {
  assert.deepEqual(Object.keys(fabui.Tree.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.Tree.locales.en.tree, 'Tree');
  assert.equal(fabui.Tree.locales['zh-TW'].loading, '載入中');
  assert.equal(fabui.Tree.locales['zh-CN'].check, '勾选{text}');
});

test('Tree normalizes supported themes and alias', function() {
  assert.equal(normalizeTreeTheme('material-teal'), 'material-teal');
  assert.equal(normalizeTreeTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeTreeTheme(' BLACK '), 'black');
  assert.equal(normalizeTreeTheme('unknown'), 'default');
});

test('Tree normalization creates parent links and lazy nodes', function() {
  var roots = normalizeTreeData([{
    id: 'root',
    text: 'Root',
    children: [{
      id: 'child',
      text: 'Child',
      state: 'closed'
    }]
  }]);
  assert.equal(roots.length, 1);
  assert.equal(roots[0].children[0]._parent, roots[0]);
  assert.equal(roots[0].children[0]._loaded, false);
  assert.equal(roots[0].children[0].state, 'closed');
  assert.equal(roots[0].children[0].target, null);
});

test('Tree flatten helper respects collapsed and hidden nodes', function() {
  var roots = normalizeTreeData([{
    id: 'root',
    text: 'Root',
    state: 'closed',
    children: [
      { id: 'one', text: 'One' },
      { id: 'two', text: 'Two' }
    ]
  }]);
  assert.deepEqual(
    flattenTreeData(roots, true).map(function(record) { return record.node.id; }),
    ['root']
  );
  assert.deepEqual(
    flattenTreeData(roots, false).map(function(record) { return record.node.id; }),
    ['root', 'one', 'two']
  );
  roots[0].state = 'open';
  roots[0].children[0]._hidden = true;
  assert.deepEqual(
    flattenTreeData(roots, true).map(function(record) { return record.node.id; }),
    ['root', 'two']
  );
});

test('Tree move helper supports before, after and append without cycles', function() {
  var roots = normalizeTreeData([{
    id: 'root',
    text: 'Root',
    children: [
      { id: 'one', text: 'One' },
      { id: 'two', text: 'Two' },
      { id: 'folder', text: 'Folder', children: [] }
    ]
  }]);
  var root = roots[0];
  var one = root.children[0];
  var two = root.children[1];
  var folder = root.children[2];

  assert.equal(moveTreeDataNode(roots, two, one, 'before'), true);
  assert.deepEqual(root.children.map(function(node) { return node.id; }), ['two', 'one', 'folder']);
  assert.equal(moveTreeDataNode(roots, one, folder, 'append'), true);
  assert.deepEqual(root.children.map(function(node) { return node.id; }), ['two', 'folder']);
  assert.deepEqual(folder.children.map(function(node) { return node.id; }), ['one']);
  assert.equal(one._parent, folder);
  assert.equal(moveTreeDataNode(roots, folder, one, 'append'), false);
});

test('Tree factory returns a public control class', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  var Tree = createTreeFactory(Control, function() {}, function() {});
  assert.equal(typeof Tree, 'function');
  assert.equal(Tree.defaults.cascadeCheck, true);
  assert.equal(Tree.normalizeTheme('sunny'), 'sunny');
});

test('Tree source contains delegated keyboard, lazy loading, editing and DnD paths', function() {
  var source = readFileSync(new URL('../src/tree/tree.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/tree/tree.css', import.meta.url), 'utf8');
  assert.match(source, /addEventListener\(this\.hostElement, 'keydown'/);
  assert.match(source, /addEventListener\(this\.hostElement, 'dragstart'/);
  assert.match(source, /FabTree\.prototype\._defaultLoader/);
  assert.match(source, /FabTree\.prototype\.beginEdit/);
  assert.match(source, /FabTree\.prototype\.doFilter/);
  assert.match(css, /\.fui-tree-drop-before::before/);
  assert.match(css, /opacity: var\(--fg-drag-indicator-opacity, 0\.55\)/);
});
