import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  normalizeAccordionHalign,
  normalizeAccordionTheme
} from '../src/accordion/accordion.js';

test('FabUI core publishes Accordion as a Control subclass', function() {
  assert.equal(typeof fabui.Accordion, 'function');
  assert.equal(
    Object.getPrototypeOf(fabui.Accordion.prototype),
    fabui.Control.prototype
  );
});

test('Accordion exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.Accordion.defaults.width, 'auto');
  assert.equal(fabui.Accordion.defaults.height, 'auto');
  assert.equal(fabui.Accordion.defaults.fit, false);
  assert.equal(fabui.Accordion.defaults.border, true);
  assert.equal(fabui.Accordion.defaults.animate, true);
  assert.equal(fabui.Accordion.defaults.animationDuration, 180);
  assert.equal(fabui.Accordion.defaults.multiple, false);
  assert.equal(fabui.Accordion.defaults.selected, 0);
  assert.equal(fabui.Accordion.defaults.halign, 'top');
});

test('Accordion normalizes supported themes and header alignment', function() {
  assert.equal(normalizeAccordionTheme('material-teal'), 'material-teal');
  assert.equal(normalizeAccordionTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeAccordionTheme(' BLACK '), 'black');
  assert.equal(normalizeAccordionTheme('mono'), 'mono');
  assert.equal(normalizeAccordionTheme('mono-red'), 'mono-red');
  assert.equal(normalizeAccordionTheme('mono-green'), 'mono-green');
  assert.equal(normalizeAccordionTheme('unknown'), 'default');
  assert.equal(normalizeAccordionHalign('left'), 'left');
  assert.equal(normalizeAccordionHalign('RIGHT'), 'right');
  assert.equal(normalizeAccordionHalign('invalid'), 'top');
});

test('Accordion publishes matching locale and theme metadata', function() {
  assert.deepEqual(
    Object.keys(fabui.Accordion.locales),
    ['en', 'zh-TW', 'zh-CN']
  );
  assert.deepEqual(fabui.Accordion.themes, [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ]);
  assert.equal(
    fabui.Accordion.locales['zh-TW'].expand,
    '展開「{title}」'
  );
  assert.equal(
    fabui.Accordion.normalizeLocale('zh_Hant_TW'),
    'zh-TW'
  );
  assert.equal(fabui.Accordion.normalizeLocale('zh-Hans'), 'zh-CN');
});

test('Accordion composes Panel instead of duplicating its renderer', function() {
  var source = readFileSync(
    new URL('../src/accordion/accordion.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /panel = new Panel\(host, panelOptions\)/);
  assert.match(source, /record\.panel\.expand\(\)/);
  assert.match(source, /record\.panel\.collapse\(\)/);
  assert.doesNotMatch(source, /className\s*=\s*['"]fui-panel(?:['"\s])/);
  assert.match(source, /Accordion\.prototype\.getSelections/);
  assert.match(source, /Accordion\.prototype\.getPanelIndex/);
  assert.match(source, /Accordion\.prototype\.setOptions/);
  assert.match(source, /Accordion\.prototype\.destroy/);
});

test('Accordion styles match all EasyUI reference palettes', function() {
  var css = readFileSync(
    new URL('../src/accordion/accordion.css', import.meta.url),
    'utf8'
  );
  var expected = {
    default: ['#95b8e7', '#e0ecff', '#ffe48d', '#000'],
    bootstrap: ['#d4d4d4', '#f2f2f2', '#0081c2', '#fff'],
    cupertino: ['#aed0ea', '#d7ebf9', '#3baae3', '#fff'],
    material: ['#ddd', '#f5f5f5', '#00bbee', '#fff'],
    'material-blue': ['#dfdfdf', '#f5f5f5', '#eee', '#2196f3'],
    'material-teal': ['#dfdfdf', '#fafafa', '#eee', '#39c'],
    metro: ['#ddd', '#fff', '#cce6ff', '#000'],
    'metro-blue': ['#c3d9e0', '#daeef5', '#6caef5', '#fff'],
    'metro-gray': ['#abafb8', '#c7ccd1', '#84909c', '#fff'],
    'metro-green': ['#b1c242', '#e5f0c9', '#c8d47b', '#404040'],
    'metro-orange': ['#d4a375', '#f0e3bf', '#f7cc8f', '#404040'],
    'metro-red': ['#f6c1bc', '#f0e1e3', '#f09090', '#404040'],
    sunny: ['#494437', '#817865', '#fff', '#0074c7'],
    'pepper-grinder': ['#cbc7bd', '#f8f7f6', '#b83400', '#fff'],
    'dark-hive': ['#444', '#222', '#0972a5', '#fff'],
    black: ['#000', '#3d3d3d', '#0052a3', '#fff']
  };
  var names = [
    '--fui-accordion-border',
    '--fui-accordion-header-bg',
    '--fui-accordion-selected-bg',
    '--fui-accordion-selected-text'
  ];

  Object.keys(expected).forEach(function(theme) {
    var match = css.match(new RegExp(
      '\\.fui-accordion\\.fg-theme-' +
      theme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*\\{([\\s\\S]*?)\\}'
    ));
    assert.ok(match, theme);
    names.forEach(function(name, index) {
      assert.match(
        match[1],
        new RegExp(
          name + ':\\s*' +
          expected[theme][index].replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          ) +
          '\\s*;',
          'i'
        ),
        theme + ' ' + name
      );
    });
  });

  assert.doesNotMatch(css, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});

test('Accordion uses each theme matching arrow sprite', function() {
  var iconCss = readFileSync(
    new URL('../src/fabui.icon.css', import.meta.url),
    'utf8'
  );
  var expectedHashes = {
    default: 'fdc20e0c6f2d51f34728c3791c7a28f3ef1e9ac5',
    bootstrap: 'fdc20e0c6f2d51f34728c3791c7a28f3ef1e9ac5',
    cupertino: 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    material: 'bf1f7cc8e51fd52976b17e1e07aa7b4377eeb47b',
    'material-blue': 'bf1f7cc8e51fd52976b17e1e07aa7b4377eeb47b',
    'material-teal': 'bf1f7cc8e51fd52976b17e1e07aa7b4377eeb47b',
    metro: 'fdc20e0c6f2d51f34728c3791c7a28f3ef1e9ac5',
    'metro-blue': 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    'metro-gray': 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    'metro-green': 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    'metro-orange': 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    'metro-red': 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    sunny: 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    'pepper-grinder': 'e3697932313fb93e4ca5b8daac18784d6936e38d',
    'dark-hive': 'a2285badc830f92c35e2d8baf4d07a24b779fbbd',
    black: 'a2285badc830f92c35e2d8baf4d07a24b779fbbd'
  };

  Object.keys(expectedHashes).forEach(function(theme) {
    var png = readFileSync(
      new URL(
        '../src/theme/' + theme + '/images/accordion_arrows.png',
        import.meta.url
      )
    );
    assert.equal(
      createHash('sha1').update(png).digest('hex'),
      expectedHashes[theme],
      theme
    );
    assert.match(
      iconCss,
      new RegExp(
        "--fui-accordion-arrows:\\s*url\\('theme/" +
        theme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        "/images/accordion_arrows\\.png'\\)"
      ),
      theme
    );
    assert.match(
      iconCss,
      new RegExp(
        "\\.fui-accordion\\.fg-theme-" +
        theme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        "\\s+\\.fui-accordion-toggle\\s*\\{[\\s\\S]*?" +
        "background-image:\\s*url\\('theme/" +
        theme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        "/images/accordion_arrows\\.png'\\)"
      ),
      theme + ' rendered arrow'
    );
  });
});

test('Accordion exposes collapse and expand icons with transitions', function() {
  var source = readFileSync(
    new URL('../src/accordion/accordion.js', import.meta.url),
    'utf8'
  );
  var css = readFileSync(
    new URL('../src/accordion/accordion.css', import.meta.url),
    'utf8'
  );

  assert.match(source, /'fui-accordion-collapse'/);
  assert.match(source, /'fui-accordion-expand'/);
  assert.match(source, /'fui-accordion-animated'/);
  assert.match(source, /--fui-accordion-animation-duration/);
  assert.match(css, /\.fui-accordion \.fui-accordion-collapse/);
  assert.match(css, /\.fui-accordion \.fui-accordion-expand/);
  assert.match(css, /transition:[\s\S]*flex-grow/);
  assert.match(css, /transition:[\s\S]*height/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('Accordion source supports keyboard and ARIA disclosure behavior', function() {
  var source = readFileSync(
    new URL('../src/accordion/accordion.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(source, /event\.key === 'ArrowDown'/);
  assert.match(source, /event\.key === 'Home'/);
  assert.match(source, /header\.setAttribute\('aria-expanded'/);
  assert.match(source, /body\.setAttribute\('aria-labelledby'/);
  assert.match(source, /header\.setAttribute\('aria-disabled'/);
});
