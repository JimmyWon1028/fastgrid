import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import fabui, { Gantt } from '../src/fabui.gantt.js';
import {
  createTimelineScale,
  normalizeGanttData
} from '../src/gantt/gantt.js';

test('Gantt is published only by the standalone source entry', function() {
  var coreSource = readFileSync(
    new URL('../src/fabui.js', import.meta.url),
    'utf8'
  );
  var coreCss = readFileSync(
    new URL('../src/fabui.css', import.meta.url),
    'utf8'
  );
  assert.equal(fabui.Gantt, Gantt);
  assert.equal(typeof Gantt, 'function');
  assert.equal(Object.getPrototypeOf(Gantt.prototype), fabui.Control.prototype);
  assert.doesNotMatch(coreSource, /Gantt|gantt/);
  assert.doesNotMatch(coreCss, /Gantt|gantt/);
});

test('Gantt publishes complete locale and theme metadata', function() {
  var keys = Object.keys(Gantt.locales.en).sort();
  assert.deepEqual(Object.keys(Gantt.locales), ['en', 'zh-TW', 'zh-CN']);
  ['zh-TW', 'zh-CN'].forEach(function(locale) {
    assert.deepEqual(Object.keys(Gantt.locales[locale]).sort(), keys);
  });
  assert.deepEqual(Gantt.themes, [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ]);
  assert.equal(Gantt.normalizeLocale('zh_Hant_TW'), 'zh-TW');
  assert.equal(Gantt.normalizeLocale('zh-Hans'), 'zh-CN');
  assert.equal(Gantt.normalizeView('invalid'), 'week');
});

test('Gantt normalizes tasks without mutating source values', function() {
  var source = [{
    id: 9,
    title: 'Task',
    start: '2026-07-01T00:00:00',
    end: '2026-07-03T00:00:00',
    percentComplete: 75
  }];
  var tasks = normalizeGanttData(source);
  assert.notEqual(tasks[0], source[0]);
  assert.ok(tasks[0].start instanceof Date);
  assert.ok(tasks[0].end instanceof Date);
  assert.equal(tasks[0].percentComplete, 0.75);
  assert.equal(source[0].percentComplete, 75);
});

test('Gantt timeline scales support day, week, month and year views', function() {
  var tasks = normalizeGanttData([{
    id: 1,
    title: 'Task',
    start: '2026-07-01T00:00:00',
    end: '2026-07-31T00:00:00'
  }]);
  ['day', 'week', 'month', 'year'].forEach(function(view) {
    var scale = createTimelineScale(tasks, {
      view: view,
      locale: 'zh-TW'
    });
    assert.equal(scale.view, view);
    assert.ok(scale.ticks.length > 0, view);
    assert.ok(scale.groups.length > 0, view);
    assert.ok(scale.width > 0, view);
    assert.ok(scale.x(tasks[0].end) >= scale.x(tasks[0].start), view);
    assert.ok(scale.dateAt(scale.x(tasks[0].start)) instanceof Date, view);
  });
});

test('Gantt source includes task editing, dependency and interaction contracts', function() {
  var source = readFileSync(
    new URL('../src/gantt/gantt.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /new fabui\.Button/);
  assert.match(source, /new fabui\.EditBox/);
  assert.match(source, /new fabui\.Window/);
  assert.match(source, /registerControl\(host, this\)/);
  assert.match(source, /unregisterControl\(host, this\)/);
  assert.match(source, /_renderDependencies/);
  assert.match(source, /pointercancel/);
  assert.match(source, /Gantt\.prototype\.setView/);
  assert.match(source, /Gantt\.prototype\.addTask/);
  assert.match(source, /Gantt\.prototype\.updateTask/);
  assert.match(source, /Gantt\.prototype\.removeTask/);
  assert.match(source, /Gantt\.prototype\.dispose/);
});

test('Gantt build is standalone and load order is explicit', function() {
  var buildSource = readFileSync(
    new URL('../build/build-gantt.cjs', import.meta.url),
    'utf8'
  );
  var packageJson = JSON.parse(readFileSync(
    new URL('../package.json', import.meta.url),
    'utf8'
  ));
  var demo = readFileSync(
    new URL('../demo/gantt.html', import.meta.url),
    'utf8'
  );
  assert.equal(packageJson.scripts['build:gantt'], 'node build/build-gantt.cjs');
  assert.match(buildSource, /fabui\.gantt\.js/);
  assert.doesNotMatch(buildSource, /writeFileSync\([^)]*fabui\.gantt\.esm/s);
  assert.match(buildSource, /Load fabui\.js before fabui\.gantt\.js/);
  assert.ok(
    demo.indexOf('../dist/fabui.js') <
    demo.indexOf('../dist/fabui.gantt.js')
  );
  assert.ok(
    demo.indexOf('../dist/fabui.css') <
    demo.indexOf('../dist/fabui.gantt.css')
  );
});

test('Gantt source Demo shares one FabUI core module instance', function() {
  var entry = readFileSync(
    new URL('../src/fabui.gantt.js', import.meta.url),
    'utf8'
  );
  var demo = readFileSync(
    new URL('../demo/dev-gantt.html', import.meta.url),
    'utf8'
  );
  var entryImport = entry.match(/from '\.\/fabui\.js(\?[^']+)'/);
  var demoImport = demo.match(/from '\.\.\/src\/fabui\.js(\?[^']+)'/);
  assert.ok(entryImport);
  assert.ok(demoImport);
  assert.equal(demoImport[1], entryImport[1]);
});

test('Gantt Demo and API documentation are present', function() {
  [
    'demo/dev-gantt.html',
    'demo/gantt.html',
    'demo/js/gantt-demo.js',
    'demo/css/gantt-demo.css',
    'docs/gantt-api.md'
  ].forEach(function(file) {
    assert.equal(existsSync(file), true, file);
  });
});
