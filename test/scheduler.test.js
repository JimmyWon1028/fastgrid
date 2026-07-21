import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import coreFabui from '../src/fabui.js';
import {
  createSchedulerFactory,
  schedulerScrollbarWidth,
  normalizeSchedulerTheme,
  normalizeSchedulerView
} from '../src/scheduler/scheduler.js';

test('FabUI core does not publish the optional Scheduler extension', function() {
  assert.equal(
    Object.prototype.hasOwnProperty.call(coreFabui, 'Scheduler'),
    false
  );
  var coreSource = readFileSync(
    new URL('../src/fabui.js', import.meta.url),
    'utf8'
  );
  var coreCss = readFileSync(
    new URL('../src/fabui.css', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(coreSource, /scheduler/i);
  assert.doesNotMatch(coreCss, /scheduler/i);
});

test('Scheduler factory requires FabUI core to be loaded first', function() {
  assert.throws(
    function() { createSchedulerFactory({}); },
    /requires fabui\.Control/
  );
});

test('Scheduler extension publishes a Control subclass with metadata', function() {
  var Scheduler = createSchedulerFactory(coreFabui);
  assert.equal(typeof Scheduler, 'function');
  assert.equal(
    Object.getPrototypeOf(Scheduler.prototype),
    coreFabui.Control.prototype
  );
  assert.deepEqual(Scheduler.themes, [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ]);
  assert.deepEqual(Scheduler.views, [
    'day', 'workWeek', 'week', 'month', 'year', 'agenda', 'timeline'
  ]);
  assert.deepEqual(Object.keys(Scheduler.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(Scheduler.normalizeLocale('zh_Hant_TW'), 'zh-TW');
  assert.equal(Scheduler.normalizeLocale('zh-Hans'), 'zh-CN');
});

test('Scheduler normalizes themes and public view names', function() {
  assert.equal(normalizeSchedulerTheme('material-teal'), 'material-teal');
  assert.equal(normalizeSchedulerTheme('mono'), 'mono');
  assert.equal(normalizeSchedulerTheme('mono-red'), 'mono-red');
  assert.equal(normalizeSchedulerTheme('mono-green'), 'mono-green');
  assert.equal(normalizeSchedulerTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeSchedulerTheme('unknown'), 'default');
  assert.equal(normalizeSchedulerView('workweek'), 'workWeek');
  assert.equal(normalizeSchedulerView('MONTH'), 'month');
  assert.equal(normalizeSchedulerView('unknown'), 'week');
});

test('Scheduler aligns time headers with the scrollable day columns', function() {
  assert.equal(schedulerScrollbarWidth({
    offsetWidth: 100,
    clientWidth: 85
  }), 15);
  assert.equal(schedulerScrollbarWidth({
    offsetWidth: 85,
    clientWidth: 100
  }), 0);
  assert.equal(schedulerScrollbarWidth(null), 0);
});

test('Scheduler composes existing FabUI controls and scoped popup lifecycle', function() {
  var source = readFileSync(
    new URL('../src/scheduler/scheduler.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /new Button\(/);
  assert.match(source, /new Window\(/);
  assert.match(source, /new EditBox\(/);
  assert.match(source, /new CheckBox\(/);
  assert.match(source, /document\.addEventListener\('pointermove'/);
  assert.match(source, /document\.removeEventListener\('pointermove'/);
  assert.match(source, /pointercancel/);
  assert.match(source, /header\.style\.paddingRight = scrollbarWidth/);
  assert.match(source, /allDay\.style\.paddingRight = scrollbarWidth/);
  assert.match(source, /Scheduler\.prototype\.dispose/);
});

test('Scheduler styles contain all themes and stay independent of res assets', function() {
  var css = readFileSync(
    new URL('../src/scheduler/scheduler.css', import.meta.url),
    'utf8'
  );
  [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ].forEach(function(theme) {
    assert.match(
      css,
      new RegExp(
        'fg-theme-' +
        theme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      ),
      theme
    );
  });
  assert.doesNotMatch(css, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});

test('Scheduler build script creates independent browser and CSS files', function() {
  var buildSource = readFileSync(
    new URL('../build/build-scheduler.cjs', import.meta.url),
    'utf8'
  );
  assert.match(buildSource, /fabui\.scheduler\.js/);
  assert.doesNotMatch(buildSource, /writeFileSync\([^)]*fabui\.scheduler\.esm/s);
  assert.match(buildSource, /fabui\.scheduler\.css/);
  assert.match(buildSource, /Load fabui\.\* first/);
  assert.doesNotMatch(
    readFileSync(new URL('../build/build.cjs', import.meta.url), 'utf8'),
    /scheduler\/scheduler\.js/
  );
  assert.match(buildSource, /fabui\.scheduler\.min\.js/);
  assert.match(buildSource, /fabui\.scheduler\.min\.css/);
});
