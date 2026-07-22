import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

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
  'sunny',
  'mono',
  'mono-red',
  'mono-green'
];

test('Every FabUI theme defines the new component palette variables', function() {
  themes.forEach(function(theme) {
    var css = readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    assert.match(css, /--fui-checkbox-accent:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-border:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-group-bg:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-header-text:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-group-text:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-panel-bg:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-panel-text:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-control-placeholder:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-control-selected:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-control-selected-text:\s*#[0-9a-f]{3,6}/i, theme);
  });
});

test('Mono theme keeps its icon assets SVG-only and maps every referenced file', function() {
  var directory = new URL('../src/theme/mono/images/', import.meta.url);
  var files = readdirSync(directory);
  var cssFiles = [
    '../src/theme/mono/components.css',
    '../src/theme/mono-red/components.css',
    '../src/theme/mono-green/components.css',
    '../src/theme/mono/tabs.css',
    '../src/theme/mono-red/tabs.css',
    '../src/theme/mono-green/tabs.css',
    '../src/theme/fabgrid.mono.css',
    '../src/theme/fabgrid.mono-red.css',
    '../src/theme/fabgrid.mono-green.css'
  ];
  var cssEntries = cssFiles.map(function(file) {
    var url = new URL(file, import.meta.url);
    return {
      css: readFileSync(url, 'utf8'),
      url: url
    };
  });
  var css = cssEntries.map(function(entry) {
    return entry.css;
  }).join('\n');
  var requiredFiles = [
    'accordion-collapse.svg',
    'accordion-expand.svg',
    'layout-down.svg',
    'layout-left.svg',
    'layout-right.svg',
    'layout-up.svg',
    'pagination-first.svg',
    'pagination-last.svg',
    'pagination-load.svg',
    'pagination-next.svg',
    'pagination-prev.svg',
    'panel-close.svg',
    'panel-collapse.svg',
    'panel-expand.svg',
    'panel-maximize.svg',
    'panel-minimize.svg',
    'panel-restore.svg',
    'tabs-close.svg',
    'tabs-next.svg',
    'tabs-prev.svg',
    'tree-checkbox-checked.svg',
    'tree-checkbox-mixed.svg',
    'tree-checkbox-unchecked.svg',
    'tree-collapse.svg',
    'tree-expand.svg',
    'tree-file.svg',
    'tree-folder-open.svg',
    'tree-folder.svg'
  ];

  files.forEach(function(file) {
    assert.match(file, /\.svg$/i, file);
    assert.match(readFileSync(new URL(file, directory), 'utf8'), /<svg\b/i, file);
  });
  requiredFiles.forEach(function(file) {
    assert.equal(files.includes(file), true, file);
  });
  cssEntries.forEach(function(entry) {
    Array.from(entry.css.matchAll(/url\(['\"]?([^'\")]+)['\"]?\)/g)).forEach(function(match) {
      assert.equal(existsSync(new URL(match[1], entry.url)), true, match[1]);
    });
  });
  assert.doesNotMatch(css, /default\/images|\.(?:png|gif)\b/i);
  assert.doesNotMatch(
    css,
    /(?:accordion_arrows|layout_arrows|pagination_icons|panel_tools|tabs_icons|tree_icons)/i
  );
});

test('Mono theme uses the Metro Gray palette with its own SVG icon layer', function() {
  function variables(css) {
    return Object.fromEntries(Array.from(
      css.matchAll(/(--[\w-]+):\s*([^;]+);/g),
      function(match) {
        return [match[1], match[2].trim().toLowerCase()];
      }
    ));
  }

  var monoGrid = variables(readFileSync(
    new URL('../src/theme/fabgrid.mono.css', import.meta.url),
    'utf8'
  ));
  var metroGrid = variables(readFileSync(
    new URL('../src/theme/fabgrid.metro-gray.css', import.meta.url),
    'utf8'
  ));
  var metroComponentSource = readFileSync(
    new URL('../src/theme/metro-gray/components.css', import.meta.url),
    'utf8'
  );
  var metroComponents = variables(metroComponentSource);
  var monoComponents = variables(metroComponentSource + readFileSync(
    new URL('../src/theme/mono/components.css', import.meta.url),
    'utf8'
  ));
  var monoTabs = variables(readFileSync(
    new URL('../src/theme/mono/tabs.css', import.meta.url),
    'utf8'
  ));
  var metroTabs = variables(readFileSync(
    new URL('../src/theme/metro-gray/tabs.css', import.meta.url),
    'utf8'
  ));
  var monoAliases = monoComponents;

  assert.deepEqual(monoGrid, metroGrid);
  Object.keys(metroComponents).forEach(function(name) {
    if (/^url\(/.test(metroComponents[name])) return;
    assert.equal(monoComponents[name], metroComponents[name], name);
  });
  Object.keys(metroTabs).forEach(function(name) {
    if (/^url\(/.test(metroTabs[name])) return;
    assert.equal(monoTabs[name], metroTabs[name], name);
  });
  assert.equal(monoAliases['--fui-accordion-selected-bg'], '#84909c');
  assert.equal(monoAliases['--fui-layout-splitter-active'], '#84909c');
  assert.equal(monoAliases['--fui-panel-header-bg'], '#c7ccd1');
  assert.equal(monoAliases['--fui-switchbutton-on-bg'], '#84909c');
  assert.equal(monoAliases['--fui-tree-selected-bg'], '#84909c');
  assert.equal(monoAliases['--fui-window-frame'], '#c7ccd1');
  assert.equal(monoAliases['--fui-datebox-footer-bg'], '#c7ccd1');
});

test('Base CSS contains Default only and external themes use fixed selectors', function() {
  var entry = readFileSync(
    new URL('../src/fabui.css', import.meta.url),
    'utf8'
  );

  assert.match(entry, /theme\/fabgrid\.default\.css/);
  assert.doesNotMatch(entry, /theme\/fabgrid\.(?!default)[^'"?]+\.css/);
  themes.forEach(function(theme) {
    var rootCss = readFileSync(
      new URL('../src/theme/fabgrid.' + theme + '.css', import.meta.url),
      'utf8'
    );
    var components = readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var tabs = readFileSync(
      new URL('../src/theme/' + theme + '/tabs.css', import.meta.url),
      'utf8'
    );
    assert.doesNotMatch(rootCss + components + tabs, /\.fg-theme-/, theme);
    if (theme !== 'default') assert.match(rootCss, /\.fg-root/);
  });
});

test('Mono Red and Mono Green reuse their matching Metro palettes and Mono icons', function() {
  function variables(file) {
    var css = readFileSync(new URL(file, import.meta.url), 'utf8');
    return Object.fromEntries(Array.from(
      css.matchAll(/(--[\w-]+):\s*([^;]+);/g),
      function(match) {
        return [match[1], match[2].trim().toLowerCase()];
      }
    ));
  }

  [
    { mono: 'mono-red', metro: 'metro-red' },
    { mono: 'mono-green', metro: 'metro-green' }
  ].forEach(function(pair) {
    var grid = variables('../src/theme/fabgrid.' + pair.mono + '.css');
    var metroGrid = variables('../src/theme/fabgrid.' + pair.metro + '.css');
    var metroComponentSource = readFileSync(
      new URL('../src/theme/' + pair.metro + '/components.css', import.meta.url),
      'utf8'
    );
    var metroComponents = variables('../src/theme/' + pair.metro + '/components.css');
    var components = Object.assign(
      {},
      Object.fromEntries(Array.from(
        metroComponentSource.matchAll(/(--[\w-]+):\s*([^;]+);/g),
        function(match) {
          return [match[1], match[2].trim().toLowerCase()];
        }
      )),
      variables('../src/theme/' + pair.mono + '/components.css')
    );
    var tabs = variables('../src/theme/' + pair.mono + '/tabs.css');
    var metroTabs = variables('../src/theme/' + pair.metro + '/tabs.css');
    var rootCss = readFileSync(
      new URL('../src/theme/fabgrid.' + pair.mono + '.css', import.meta.url),
      'utf8'
    );
    var tabsCss = readFileSync(
      new URL('../src/theme/' + pair.mono + '/tabs.css', import.meta.url),
      'utf8'
    );

    assert.deepEqual(grid, metroGrid, pair.mono + ' grid palette');
    Object.keys(metroComponents).forEach(function(name) {
      if (/^url\(/.test(metroComponents[name])) return;
      assert.equal(
        components[name],
        metroComponents[name],
        pair.mono + ' component palette ' + name
      );
    });
    Object.keys(metroTabs).forEach(function(name) {
      if (/^url\(/.test(metroTabs[name])) return;
      assert.equal(tabs[name], metroTabs[name], pair.mono + ' tabs palette ' + name);
    });
    assert.match(rootCss, /mono\/images\/pagination-first\.svg/);
    assert.match(tabsCss, /\.\.\/mono\/images\/tabs-close\.svg/);
    assert.doesNotMatch(rootCss + tabsCss, /\.(?:png|gif)\b/i);
  });
});

test('Today component styles consume theme variables without res dependencies', function() {
  var files = [
    '../src/tabs/tabs.css',
    '../src/propertygrid/propertygrid.css',
    '../src/checkbox/checkbox.css',
    '../src/filebox/filebox.css',
    '../src/checkgroup/checkgroup.css',
    '../src/switchbutton/switchbutton.css',
    '../src/radiobutton/radiobutton.css',
    '../src/radiogroup/radiogroup.css',
    '../src/tree/tree.css'
  ];
  var css = files.map(function(file) {
    return readFileSync(new URL(file, import.meta.url), 'utf8');
  }).join('\n');
  assert.match(css, /--fui-tabs-border/);
  assert.match(css, /--fui-propertygrid-group-bg/);
  assert.match(css, /--fui-checkbox-accent/);
  assert.match(css, /--fui-filebox-button-bg/);
  assert.match(css, /--fui-checkgroup-text/);
  assert.match(css, /--fui-switchbutton-on-bg/);
  assert.match(css, /--fui-radiobutton-accent/);
  assert.match(css, /--fui-radiogroup-text/);
  assert.match(css, /--fui-tree-icons/);
  assert.doesNotMatch(css, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});
