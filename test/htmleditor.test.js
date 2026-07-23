import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import coreFabui from '../src/fabui.js';
import {
  createHtmlEditorFactory,
  htmlEditorVideoMarkup,
  normalizeHtmlEditorLocale,
  normalizeHtmlEditorTheme,
  normalizeHtmlEditorToolbar
} from '../src/htmleditor/htmleditor.js';

var themes = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

test('FabUI core does not publish the optional HtmlEditor extension', function() {
  assert.equal(
    Object.prototype.hasOwnProperty.call(coreFabui, 'HtmlEditor'),
    false
  );
  assert.doesNotMatch(
    readFileSync(new URL('../src/fabui.js', import.meta.url), 'utf8'),
    /HtmlEditor|htmleditor/i
  );
  assert.doesNotMatch(
    readFileSync(new URL('../src/fabui.css', import.meta.url), 'utf8'),
    /html-editor/i
  );
});

test('HtmlEditor factory requires the complete FabUI core dependency set', function() {
  assert.throws(
    function() { createHtmlEditorFactory({}); },
    /requires fabui\.Control/
  );
  assert.throws(
    function() { createHtmlEditorFactory({ Control: function() {} }); },
    /requires fabui\.Button, Window, EditBox, CheckBox and FileBox/
  );
});

test('HtmlEditor publishes a Control subclass with complete locale and theme metadata', function() {
  var HtmlEditor = createHtmlEditorFactory(coreFabui);
  var expectedKeys = Object.keys(HtmlEditor.locales.en).sort();
  assert.equal(typeof HtmlEditor, 'function');
  assert.equal(Object.getPrototypeOf(HtmlEditor.prototype), coreFabui.Control.prototype);
  assert.deepEqual(HtmlEditor.themes, themes);
  assert.equal(HtmlEditor.defaults.colors.length, 64);
  assert.deepEqual(HtmlEditor.defaults.colors.slice(0, 8), [
    '#000000', '#424242', '#636363', '#9C9C94',
    '#CEC6CE', '#EFEFEF', '#F7F7F7', '#FFFFFF'
  ]);
  assert.deepEqual(HtmlEditor.defaults.colors.slice(-8), [
    '#630000', '#7B3900', '#846300', '#295218',
    '#083139', '#003163', '#21104A', '#4A1031'
  ]);
  assert.deepEqual(Object.keys(HtmlEditor.locales), ['en', 'zh-TW', 'zh-CN']);
  Object.keys(HtmlEditor.locales).forEach(function(locale) {
    assert.deepEqual(Object.keys(HtmlEditor.locales[locale]).sort(), expectedKeys);
  });
  assert.equal(HtmlEditor.normalizeLocale('zh_Hant_TW'), 'zh-TW');
  assert.equal(HtmlEditor.normalizeLocale('zh-Hans'), 'zh-CN');
});

test('HtmlEditor normalizes locale, theme and Summernote-style toolbar groups', function() {
  assert.equal(normalizeHtmlEditorLocale('zh-Hant'), 'zh-TW');
  assert.equal(normalizeHtmlEditorLocale('zh_CN'), 'zh-CN');
  assert.equal(normalizeHtmlEditorLocale('en-US'), 'en');
  assert.equal(normalizeHtmlEditorTheme('mono-green'), 'mono-green');
  assert.equal(normalizeHtmlEditorTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeHtmlEditorTheme('unknown'), 'default');
  assert.deepEqual(normalizeHtmlEditorToolbar([
    ['font', ['bold', 'italic', 'unknown']],
    ['empty', ['unknown']]
  ]), [
    ['font', ['bold', 'italic']]
  ]);
  assert.ok(normalizeHtmlEditorToolbar().some(function(group) {
    return group[0] === 'view' && group[1].indexOf('codeview') >= 0;
  }));
  assert.deepEqual(
    normalizeHtmlEditorToolbar().find(function(group) {
      return group[0] === 'color';
    }),
    ['color', ['color', 'backcolor']]
  );
});

test('HtmlEditor creates safe YouTube, Vimeo and direct video markup', function() {
  assert.match(
    htmlEditorVideoMarkup('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/
  );
  assert.match(
    htmlEditorVideoMarkup('https://vimeo.com/123456'),
    /player\.vimeo\.com\/video\/123456/
  );
  assert.match(
    htmlEditorVideoMarkup('https://example.com/video.mp4'),
    /^<video[^>]+controls>/
  );
  assert.equal(htmlEditorVideoMarkup('javascript:alert(1)'), '');
});

test('HtmlEditor composes FabUI controls and scopes popup and resize listeners', function() {
  var source = readFileSync(
    new URL('../src/htmleditor/htmleditor.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /new Button\(/);
  assert.match(source, /new Window\(/);
  assert.match(source, /new EditBox\(/);
  assert.match(source, /new CheckBox\(/);
  assert.match(source, /new FileBox\(/);
  assert.match(source, /action === 'color' \? 'foreColor' : 'backColor'/);
  assert.match(source, /colors\.slice\(0, -1\)\.forEach/);
  assert.match(source, /document\.addEventListener\('pointerdown'/);
  assert.match(source, /document\.removeEventListener\('pointerdown'/);
  assert.match(source, /document\.addEventListener\('pointermove'/);
  assert.match(source, /document\.removeEventListener\('pointermove'/);
  assert.match(source, /pointercancel/);
  assert.match(
    source,
    /event\.target === self\.editableElement[\s\S]*addEventListener\(document, 'selectionchange'/
  );
  assert.match(
    source,
    /event\.target === self\.editableElement[\s\S]*removeEventListener\(document, 'selectionchange'/
  );
  assert.match(source, /HtmlEditor\.prototype\._cancelImageRead/);
  assert.match(source, /self\._dialog !== dialog/);
  assert.match(source, /if \(self\._dialog === dialog\) self\._destroyDialog\(\)/);
  assert.match(source, /HtmlEditor\.prototype\.dispose/);
  assert.match(
    readFileSync(new URL('../demo/js/demo-controls.js', import.meta.url), 'utf8'),
    /__fabuiHtmlEditor[\s\S]*\.fui-html-editor/
  );
});

test('HtmlEditor CSS uses fixed selectors and inherited theme variables', function() {
  var css = readFileSync(
    new URL('../src/htmleditor/htmleditor.css', import.meta.url),
    'utf8'
  );
  var icons = readFileSync(
    new URL('../src/fabui.icon.css', import.meta.url),
    'utf8'
  );
  assert.match(css, /\.fui-html-editor\s*\{/);
  assert.match(css, /var\(--fui-control-border/);
  assert.match(css, /var\(--fui-panel-bg/);
  assert.match(css, /grid-template-columns: repeat\(8, 20px\)/);
  assert.match(css, /\.fui-html-editor-color-clear\s*\{/);
  assert.doesNotMatch(css, /grid-column: 1 \/ -1/);
  assert.doesNotMatch(css, /\.fui-html-editor-focused\s*\{/);
  assert.doesNotMatch(css, /\.fg-theme-/);
  assert.doesNotMatch(css, /(?:^|[('\"\s])\.\.\/\.\.\/res\//m);
  assert.match(icons, /icon-html-editor-style/);
  assert.match(icons, /Summernote note-icon-magic glyph geometry/);
  assert.match(icons, /viewBox='-232 -2096 2351 2274'/);
  assert.match(icons, /icon-html-editor-link/);
  assert.match(icons, /icon-html-editor-picture/);
  assert.match(icons, /icon-html-editor-video/);
  assert.match(icons, /icon-html-editor-codeview/);
  assert.match(icons, /icon-html-editor-backcolor/);
  assert.match(icons, /font: 400 14px\/16px Arial/);
  assert.match(icons, /\.icon-html-editor-ol::before/);
  assert.match(icons, /content: '1\\A 2'/);
  assert.doesNotMatch(icons, /content: '1\\A 2\\A 3'/);
});

test('HtmlEditor build contract emits independent non-ESM browser bundles', function() {
  var buildSource = readFileSync(
    new URL('../build/build-htmleditor.cjs', import.meta.url),
    'utf8'
  );
  var packageSource = JSON.parse(readFileSync(
    new URL('../package.json', import.meta.url),
    'utf8'
  ));
  assert.match(buildSource, /fabui\.htmleditor\.js/);
  assert.match(buildSource, /fabui\.htmleditor\.min\.js/);
  assert.match(buildSource, /fabui\.htmleditor\.css/);
  assert.match(buildSource, /fabui\.htmleditor\.min\.css/);
  assert.match(buildSource, /Load fabui\.js before fabui\.htmleditor\.js/);
  assert.match(buildSource, /extractHtmlEditorIcons/);
  assert.doesNotMatch(buildSource, /writeFileSync\([^)]*fabui\.htmleditor\.esm/s);
  assert.equal(
    packageSource.scripts['build:htmleditor'],
    'node build/build-htmleditor.cjs'
  );
  assert.match(packageSource.scripts['build:all'], /build:htmleditor/);
});
