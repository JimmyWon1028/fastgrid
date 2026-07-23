import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import coreFabui from '../src/fabui.js';
import {
  normalizePanelHalign,
  normalizePanelTheme
} from '../src/panel/panel.js';

test('FabUI core publishes Panel', function() {
  assert.equal(typeof coreFabui.Panel, 'function');
});

test('Panel normalizes supported themes and aliases', function() {
  assert.equal(normalizePanelTheme('material-teal'), 'material-teal');
  assert.equal(normalizePanelTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizePanelTheme(' BLACK '), 'black');
  assert.equal(normalizePanelTheme('unknown'), 'default');
});

test('Panel normalizes header alignment', function() {
  assert.equal(normalizePanelHalign('left'), 'left');
  assert.equal(normalizePanelHalign('RIGHT'), 'right');
  assert.equal(normalizePanelHalign('invalid'), 'top');
});

test('Panel exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(coreFabui.Panel.defaults.title, '');
  assert.equal(coreFabui.Panel.defaults.width, 'auto');
  assert.equal(coreFabui.Panel.defaults.height, 'auto');
  assert.equal(coreFabui.Panel.defaults.border, true);
  assert.equal(coreFabui.Panel.defaults.collapsible, false);
  assert.equal(coreFabui.Panel.defaults.minimizable, false);
  assert.equal(coreFabui.Panel.defaults.maximizable, false);
  assert.equal(coreFabui.Panel.defaults.closable, false);
  assert.equal(coreFabui.Panel.defaults.cache, true);
  assert.equal(coreFabui.Panel.defaults.animate, true);
  assert.equal(coreFabui.Panel.defaults.animationDuration, 180);
});

test('Panel default extractor returns body content when present', function() {
  assert.equal(
    coreFabui.Panel.defaults.extractor('<html><body><strong>Panel</strong></body></html>'),
    '<strong>Panel</strong>'
  );
});

test('Panel state changes use shared reduced-motion aware transitions', function() {
  var source = readFileSync(new URL('../src/panel/panel.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/panel/panel.css', import.meta.url), 'utf8');
  assert.match(source, /_getAnimationDuration/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /FabPanel\.prototype\.maximize[\s\S]*?_animateState/);
  assert.match(source, /FabPanel\.prototype\.restore[\s\S]*?_animateState/);
  assert.match(source, /FabPanel\.prototype\.collapse[\s\S]*?_animateState/);
  assert.match(source, /FabPanel\.prototype\.expand[\s\S]*?_animateState/);
  assert.match(css, /\.fui-panel-transitioning/);
  assert.match(css, /height var\(--fui-panel-animation-duration\)/);
  assert.match(css, /\.fui-panel-content-hidden/);
  assert.match(css, /\.fui-panel-collapsed\.fui-panel-halign-top[\s\S]*?height: fit-content !important/);
  assert.match(css, /\.fui-panel-collapsed\.fui-panel-halign-left[\s\S]*?width: fit-content !important/);
});

test('Panel ignores stale asynchronous loader results', function() {
  var source = readFileSync(new URL('../src/panel/panel.js', import.meta.url), 'utf8');
  assert.match(source, /this\._loadSequence = 0/);
  assert.match(source, /sequence = \+\+this\._loadSequence/);
  assert.match(source, /self\._destroyed \|\| sequence !== self\._loadSequence/);
  assert.match(source, /result\.then\(resolve, reject\)/);
  assert.match(source, /FabPanel\.prototype\.destroy[\s\S]*this\._loadSequence \+= 1/);
});

test('Panel theme styles match every EasyUI panel reference palette', function() {
  var baseCss = readFileSync(
    new URL('../src/panel/panel.css', import.meta.url),
    'utf8'
  );
  var expected = {
    default: ['#95b8e7', 'linear-gradient(to bottom, #eff5ff 0, #e0ecff 100%)', '#0e2d5f', '#fff', '#000', '#f4f4f4', '#000', '#eaf2ff', '3px', '14px'],
    bootstrap: ['#d4d4d4', 'linear-gradient(to bottom, #fff 0, #f2f2f2 100%)', '#777', '#fff', '#333', '#f5f5f5', '#333', '#e6e6e6', '3px', '12px'],
    cupertino: ['#aed0ea', 'linear-gradient(to bottom, #eff5ff 0, #d7ebf9 100%)', '#2779aa', '#f2f5f7', '#000', '#f4f4f4', '#000', '#e4f1fb', '3px', '14px'],
    material: ['#ddd', '#f5f5f5', '#000', '#fff', '#404040', '#fafafa', '#404040', '#eee', '2px', '14px'],
    'material-blue': ['#dfdfdf', '#f5f5f5', '#404040', '#fff', '#404040', '#fafafa', '#404040', '#eee', '0', '14px'],
    'material-teal': ['#dfdfdf', '#fafafa', '#404040', '#fff', '#404040', '#fafafa', '#404040', '#eee', '2px', '14px'],
    metro: ['#ddd', '#fff', '#777', '#fff', '#444', '#fff', '#444', '#e6e6e6', '0', '14px'],
    'metro-blue': ['#c3d9e0', '#daeef5', '#404040', '#fafafa', '#404040', '#f5f5f5', '#404040', '#9cc8f7', '0', '14px'],
    'metro-gray': ['#abafb8', '#c7ccd1', '#404040', '#fafafa', '#404040', '#f5f5f5', '#404040', '#e6e6e6', '0', '14px'],
    'metro-green': ['#b1c242', '#e5f0c9', '#404040', '#fafafa', '#404040', '#f5f5f5', '#404040', '#e0f892', '0', '14px'],
    'metro-orange': ['#d4a375', '#f0e3bf', '#404040', '#fafafa', '#404040', '#f5f5f5', '#404040', '#fff7d6', '0', '14px'],
    'metro-red': ['#f6c1bc', '#f0e1e3', '#404040', '#fafafa', '#404040', '#f5f5f5', '#404040', '#fff0e7', '0', '14px'],
    sunny: ['#494437', 'linear-gradient(to bottom, #a69e8d 0, #817865 100%)', '#fff', '#feeebd', '#000', '#efefef', '#000', '#ffdd57', '3px', '14px'],
    'pepper-grinder': ['#cbc7bd', '#f8f7f6', '#654b24', '#eceadf', '#1f1f1f', '#f8f7f6', '#1f1f1f', '#654b24', '3px', '14px'],
    'dark-hive': ['#444', 'linear-gradient(to bottom, #626262 0, #222 100%)', '#eee', '#000', '#fff', '#222', '#fff', '#003147', '3px', '14px'],
    black: ['#000', 'linear-gradient(to bottom, #454545 0, #383838 100%)', '#fff', '#666', '#fff', '#555', '#fff', '#777', '3px', '14px']
  };
  var names = [
    '--fui-panel-border',
    '--fui-panel-header-bg',
    '--fui-panel-header-text',
    '--fui-panel-body-bg',
    '--fui-panel-body-text',
    '--fui-panel-footer-bg',
    '--fui-panel-footer-text',
    '--fui-panel-tool-hover',
    '--fui-panel-tool-radius',
    '--fui-panel-font-size'
  ];

  Object.keys(expected).forEach(function(theme) {
    var css = theme === 'default' ? baseCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var match = Array.from(css.matchAll(/\.fui-panel\s*\{([^}]*)\}/g))
      .find(function(entry) {
        return entry[1].toLowerCase().includes(expected[theme][0].toLowerCase());
      });
    assert.ok(match, theme);
    names.forEach(function(name, index) {
      var value = expected[theme][index].replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      assert.match(
        match[1],
        new RegExp(name + ':\\s*' + value + '\\s*;', 'i'),
        theme + ' ' + name
      );
    });
  });

  assert.doesNotMatch(baseCss, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});

test('Panel and Window use the matching EasyUI panel tool sprite', function() {
  var iconCss = readFileSync(
    new URL('../src/fabui.icon.css', import.meta.url),
    'utf8'
  );
  var expectedHashes = {
    default: '38eabd08a7e7884cc4049181c0eafa3a86a81c9f',
    bootstrap: '41de1471fd741f7b7cd380b8c1627544fcb4b513',
    cupertino: '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    material: '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'material-blue': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'material-teal': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    metro: '41de1471fd741f7b7cd380b8c1627544fcb4b513',
    'metro-blue': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'metro-gray': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'metro-green': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'metro-orange': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'metro-red': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    sunny: '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'pepper-grinder': '007d2527690783a878e3ec76cce9ac7fc88d3fe7',
    'dark-hive': '0773c36136a0ac43a84c8b43f53b49d46df2d80e',
    black: '0773c36136a0ac43a84c8b43f53b49d46df2d80e'
  };

  Object.keys(expectedHashes).forEach(function(theme) {
    var themeCss = theme === 'default' ? iconCss : readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    var png = readFileSync(
      new URL(
        '../src/theme/' + theme + '/images/panel_tools.png',
        import.meta.url
      )
    );
    var hash = createHash('sha1').update(png).digest('hex');
    assert.equal(hash, expectedHashes[theme], theme);
    assert.match(
      themeCss,
      /--fui-panel-tools:\s*url\('[^']*panel_tools\.png'\)/,
      theme
    );
  });

  assert.match(iconCss, /\.fui-panel-tool-minimize[\s\S]*background-position:\s*0 0/);
  assert.match(iconCss, /\.fui-window-tool-maximize[\s\S]*background-position:\s*0 -16px/);
  assert.match(iconCss, /\.fui-window-tool-close[\s\S]*background-position:\s*-16px 0/);
  assert.match(iconCss, /\.fui-panel-tool-expand[\s\S]*background-position:\s*-32px -16px/);
});

test('Panel collapse and expand icons do not change on mouse hover', function() {
  var css = readFileSync(
    new URL('../src/panel/panel.css', import.meta.url),
    'utf8'
  );

  assert.match(
    css,
    /\.fui-panel-tool-collapse:hover:not\(:focus-visible\)/
  );
  assert.match(
    css,
    /\.fui-panel-tool-expand:hover:not\(:focus-visible\)[\s\S]*?background-color:\s*transparent;[\s\S]*?opacity:\s*0\.6;/
  );
  assert.match(css, /\.fui-panel-tool:focus-visible/);
});
