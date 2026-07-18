import test from 'node:test';
import assert from 'node:assert/strict';

import fabui from '../src/fabui.js';
import { createCalendarFactory } from '../src/calendar/calendar.js';
import {
  normalizeDatePopupTheme,
  formatDatePopupLunarText
} from '../src/editbox/date-popup.js';

test('FabUI core publishes Calendar', function() {
  assert.equal(typeof fabui.Calendar, 'function');
});

test('Calendar exposes EasyUI-compatible defaults', function() {
  assert.equal(fabui.Calendar.defaults.width, 180);
  assert.equal(fabui.Calendar.defaults.height, 180);
  assert.equal(fabui.Calendar.defaults.fit, false);
  assert.equal(fabui.Calendar.defaults.border, true);
  assert.equal(fabui.Calendar.defaults.showWeek, false);
  assert.equal(fabui.Calendar.defaults.showLunar, false);
  assert.equal(fabui.Calendar.defaults.firstDay, 0);
  assert.equal(typeof fabui.Calendar.defaults.formatter, 'function');
  assert.equal(typeof fabui.Calendar.defaults.styler, 'function');
  assert.equal(typeof fabui.Calendar.defaults.validator, 'function');
  assert.equal(typeof fabui.Calendar.defaults.getWeekNumber, 'function');
  assert.equal(fabui.Calendar.defaults.formatter(new Date(2026, 6, 18)), 18);
});

test('Calendar publishes all required locale packs', function() {
  assert.deepEqual(Object.keys(fabui.Calendar.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.Calendar.locales.en.months.length, 12);
  assert.equal(fabui.Calendar.locales['zh-TW'].weeks.length, 7);
  assert.equal(fabui.Calendar.locales['zh-CN'].ariaLabel, '日历');
});

test('Calendar keeps DatePopup theme and lunar helpers shared', function() {
  assert.equal(normalizeDatePopupTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeDatePopupTheme('material-teal'), 'material-teal');
  assert.equal(typeof formatDatePopupLunarText(new Date(2026, 6, 18), 'zh-TW'), 'string');
});

test('Calendar factory validates its dependencies at construction time', function() {
  var Calendar = createCalendarFactory(
    function Control() {},
    function() {},
    function() {}
  );
  assert.equal(typeof Calendar, 'function');
  assert.equal(Calendar.defaults.showLunar, false);
});
