import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeChartLocale,
  normalizeChartTheme,
  normalizeChartType
} from '../src/chart/chart.js';

test('Chart supports only the four documented chart types', function() {
  assert.equal(normalizeChartType('column'), 'column');
  assert.equal(normalizeChartType('bar'), 'bar');
  assert.equal(normalizeChartType('line'), 'line');
  assert.equal(normalizeChartType('pie'), 'pie');
  assert.equal(normalizeChartType('Column'), 'column');
  assert.equal(normalizeChartType('LineSymbols'), 'line');
  assert.equal(normalizeChartType('unknown'), 'column');
});

test('Chart normalizes built-in locales and themes', function() {
  assert.equal(normalizeChartLocale('zh-Hant'), 'zh-TW');
  assert.equal(normalizeChartLocale('zh_CN'), 'zh-CN');
  assert.equal(normalizeChartLocale('fr'), 'en');
  assert.equal(normalizeChartTheme('dark-hive'), 'dark-hive');
  assert.equal(normalizeChartTheme('pepper'), 'pepper-grinder');
});

test('Chart keeps the public tooltip option separate from its tooltip element', function() {
  var source = fs.readFileSync('src/chart/chart.js', 'utf8');
  assert.match(source, /this\.tooltipElement = document\.createElement\('div'\)/);
  assert.match(source, /this\.tooltipElement\.classList\.remove/);
  assert.doesNotMatch(source, /this\.tooltip = document\.createElement/);
});

test('Chart disables polling when data observation is disabled', function() {
  var source = fs.readFileSync('src/chart/chart.js', 'utf8');
  assert.match(
    source,
    /startDataObserver[\s\S]*stopDataObserver\(\)[\s\S]*observeData === false\) return/
  );
  assert.match(
    source,
    /name === 'observeData' \|\| name === 'dataRefreshInterval'[\s\S]*startDataObserver/
  );
  assert.match(source, /Chart\.prototype\.stopDataObserver/);
  assert.match(source, /Chart\.prototype\.dispose[\s\S]*this\.stopDataObserver\(\)/);
});

test('Chart reuses parsed binding paths during render and data observation', function() {
  var source = fs.readFileSync('src/chart/chart.js', 'utf8');
  assert.match(source, /bindingPathCache = Object\.create\(null\)/);
  assert.match(source, /parts = bindingPathCache\[key\]/);
  assert.match(source, /bindingPathCache\[key\] = parts/);
});
