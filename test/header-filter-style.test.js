import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');
var viewSource = readFileSync(new URL('../src/grid/fabgrid-view.js', import.meta.url), 'utf8');
var themeDir = new URL('../src/theme/', import.meta.url);

test('narrow filterable headers allow text below the filter icon', function() {
  var rule = css.match(/\.fg-header-title-filter-narrow\s*\{[^}]*\}/);

  assert.ok(rule);
  assert.match(rule[0], /padding-right:\s*0/);
});

test('narrow header detection only reserves potential inline sort width for non-right-aligned headers', function() {
  assert.match(
    viewSource,
    /headerTextWidth = this\.measureAutoSizeText\(headerText, textMeasureContext\);/
  );
  assert.match(
    viewSource,
    /headerContentWidth = headerTextWidth \+ \(column\.align === 'right' \? 0 : 13\);/
  );
  assert.doesNotMatch(viewSource, /headerContentWidth[\s\S]*?sortDirection \? 13 : 0/);
});

test('right-aligned narrow headers keep the text inset only when the full label fits', function() {
  var rule = css.match(
    /\.fg-header-align-right \.fg-header-title-filter-narrow\.fg-header-title-filter-right-inset\s*\{[^}]*\}/
  );

  assert.ok(rule);
  assert.match(rule[0], /padding-right:\s*6px/);
  assert.match(
    viewSource,
    /column\.align === 'right' && headerTextWidth \+ 13 <= column\._width/
  );
});

test('right-aligned sorted headers keep sort absolute so the text anchor stays stable', function() {
  var rule = css.match(
    /\.fg-header-align-right \.fg-header-title-filterable\.fg-header-title-sorted \.fg-sort-wrap\s*\{[^}]*\}/
  );

  assert.ok(rule);
  assert.match(rule[0], /position:\s*absolute/);
  assert.match(rule[0], /right:\s*15px/);
  assert.match(rule[0], /margin-left:\s*0/);
});

test('filter icons sit two pixels closer to the header edge', function() {
  var iconRule = css.match(/\.fg-filter-icon\s*\{[^}]*\}/);
  var activeRule = css.match(/\.fg-filter-icon-active\s*\{[^}]*\}/);

  assert.ok(iconRule);
  assert.ok(activeRule);
  assert.match(iconRule[0], /right:\s*-2px/);
  assert.match(activeRule[0], /right:\s*-2px/);
});

test('active filter operators use the theme color with normal text weight', function() {
  var rootRule = css.match(/\.fg-root\s*\{[^}]*\}/);
  var activeRule = css.match(/\.fg-filter-icon-active\s*\{[^}]*\}/);

  assert.ok(rootRule);
  assert.ok(activeRule);
  assert.match(rootRule[0], /--fg-filter-operator-color:\s*blue/);
  assert.match(activeRule[0], /color:\s*var\(--fg-filter-operator-color,\s*blue\)/);
  assert.match(activeRule[0], /font-weight:\s*normal/);
});

test('light themes inherit the Default operator color and dark themes use white', function() {
  var darkThemes = new Set(['fabgrid.black.css', 'fabgrid.dark-hive.css']);
  var themeFiles = readdirSync(themeDir).filter(function(file) {
    return /^fabgrid\..+\.css$/.test(file);
  });

  assert.equal(themeFiles.length, 19);
  themeFiles.forEach(function(file) {
    var source = readFileSync(new URL(file, themeDir), 'utf8');
    if (darkThemes.has(file)) {
      assert.match(source, /--fg-filter-operator-color:\s*#fff/, file);
    } else {
      assert.doesNotMatch(source, /--fg-filter-operator-color:/, file);
    }
  });
});

test('filter funnel uses a two-pixel left inset', function() {
  var funnelRule = css.match(/\.fg-filter-icon::before\s*\{[^}]*\}/);
  var stemRule = css.match(/\.fg-filter-icon::after\s*\{[^}]*\}/);

  assert.ok(funnelRule);
  assert.ok(stemRule);
  assert.match(funnelRule[0], /left:\s*2px/);
  assert.match(stemRule[0], /left:\s*6px/);
});

test('narrow sorted headers keep icon positions while allowing text below them', function() {
  var titleRule = css.match(/\.fg-header-title-filter-narrow\.fg-header-title-sorted\s*\{[^}]*\}/);
  var sortRule = css.match(/\.fg-header-title-filter-narrow\.fg-header-title-sorted \.fg-sort-wrap\s*\{[^}]*\}/);

  assert.ok(titleRule);
  assert.ok(sortRule);
  assert.match(titleRule[0], /padding-right:\s*0/);
  assert.match(sortRule[0], /right:\s*15px/);
});
