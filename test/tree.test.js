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

test('Tree uses the matching EasyUI sprite assets for every FabUI theme', function() {
  var baseCss = readFileSync(new URL('../src/tree/tree.css', import.meta.url), 'utf8');
  var themes = [
    'default',
    'black',
    'bootstrap',
    'cupertino',
    'dark-hive',
    'material',
    'material-blue',
    'material-teal',
    'metro',
    'metro-blue',
    'metro-gray',
    'metro-green',
    'metro-orange',
    'metro-red',
    'pepper-grinder',
    'sunny'
  ];

  assert.match(baseCss, /background-position:\s*-18px 0/);
  assert.match(baseCss, /background-position:\s*-144px 0/);
  assert.match(baseCss, /background-position:\s*-208px -18px/);
  assert.match(baseCss, /background-position:\s*-240px 0/);
  assert.doesNotMatch(baseCss, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);

  themes.forEach(function(theme) {
    var css = theme === 'default' ? baseCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var png = readFileSync(
      new URL('../src/theme/' + theme + '/images/tree_icons.png', import.meta.url)
    );
    var gif = readFileSync(
      new URL('../src/theme/' + theme + '/images/loading.gif', import.meta.url)
    );
    assert.match(
      css,
      /--fui-tree-icons:\s*url\('[^']*tree_icons\.png'\)/
    );
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', theme);
    assert.equal(png.readUInt32BE(16), 272, theme);
    assert.equal(png.readUInt32BE(20), 36, theme);
    assert.match(gif.subarray(0, 6).toString('ascii'), /^GIF8[79]a$/, theme);
  });
});

test('Tree theme states match every EasyUI reference theme', function() {
  var baseCss = readFileSync(new URL('../src/tree/tree.css', import.meta.url), 'utf8');
  var expected = {
    default: ['#eaf2ff', '#000000', '#ffe48d', '#000000', '#95B8E7'],
    black: ['#777777', '#ffffff', '#0052A3', '#ffffff', '#000000'],
    bootstrap: ['#e6e6e6', '#00438a', '#0081c2', '#ffffff', '#D4D4D4'],
    cupertino: ['#e4f1fb', '#2779AA', '#3baae3', '#ffffff', '#AED0EA'],
    'dark-hive': ['#003147', '#ffffff', '#0972a5', '#ffffff', '#444444'],
    material: ['#eeeeee', '#404040', '#00bbee', '#ffffff', '#dddddd'],
    'material-blue': ['#eeeeee', '#404040', '#eeeeee', '#2196f3', '#dfdfdf'],
    'material-teal': ['#eeeeee', '#404040', '#eeeeee', '#3399cc', '#dfdfdf'],
    metro: ['#E6E6E6', '#444444', '#CCE6FF', '#000000', '#dddddd'],
    'metro-blue': ['#9cc8f7', '#404040', '#6caef5', '#ffffff', '#c3d9e0'],
    'metro-gray': ['#E6E6E6', '#404040', '#84909c', '#ffffff', '#abafb8'],
    'metro-green': ['#E0F892', '#404040', '#c8d47b', '#404040', '#b1c242'],
    'metro-orange': ['#fff7d6', '#404040', '#f7cc8f', '#404040', '#d4a375'],
    'metro-red': ['#fff0e6', '#404040', '#f09090', '#404040', '#f6c1bc'],
    'pepper-grinder': ['#654b24', '#ffffff', '#b83400', '#ffffff', '#cbc7bd'],
    sunny: ['#ffdd57', '#000000', '#ffffff', '#0074c7', '#494437']
  };

  Object.keys(expected).forEach(function(theme) {
    var css = theme === 'default' ? baseCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var match = Array.from(css.matchAll(/\.fui-tree\s*\{([^}]*)\}/g))
      .find(function(entry) {
        return entry[1].toLowerCase().includes(expected[theme][0].toLowerCase());
      });
    var block = match && match[1];
    var values = expected[theme];

    assert.ok(block, theme);
    assert.match(block, new RegExp('--fui-tree-hover-bg:\\s*' + values[0], 'i'), theme);
    assert.match(block, new RegExp('--fui-tree-hover-text:\\s*' + values[1], 'i'), theme);
    assert.match(block, new RegExp('--fui-tree-selected-bg:\\s*' + values[2], 'i'), theme);
    assert.match(block, new RegExp('--fui-tree-selected-text:\\s*' + values[3], 'i'), theme);
    assert.match(block, new RegExp('--fui-tree-editor-border:\\s*' + values[4], 'i'), theme);
  });

  assert.match(baseCss, /\.fui-tree\s*\{[\s\S]*?color:\s*inherit/);
  assert.doesNotMatch(baseCss, /\.fg-theme-/);
  assert.match(baseCss, /\.fui-tree-node:hover[\s\S]*color:\s*var\(--fui-tree-hover-text\)/);
  assert.match(baseCss, /\.fui-tree-node-selected[\s\S]*color:\s*var\(--fui-tree-selected-text\)/);
  assert.match(
    readFileSync(new URL('../src/theme/bootstrap/components.css', import.meta.url), 'utf8'),
    /\.fui-tree\s*\{[\s\S]*--fui-tree-font-size:\s*12px/
  );
});
