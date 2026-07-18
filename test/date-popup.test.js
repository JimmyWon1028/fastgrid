import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DatePopup,
  findDatePopupTheme,
  formatDatePopupLunarText,
  normalizeDatePopupTheme
} from '../src/editbox/date-popup.js';

test('DatePopup keeps lunar calendar display disabled by default', function() {
  assert.equal(DatePopup.defaults.showLunar, false);
  assert.equal(DatePopup.defaults.theme, 'default');
});

test('DatePopup normalizes supported calendar themes', function() {
  assert.equal(normalizeDatePopupTheme('material-teal'), 'material-teal');
  assert.equal(normalizeDatePopupTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeDatePopupTheme(' BLACK '), 'black');
  assert.equal(normalizeDatePopupTheme('unknown-theme'), 'default');
});

test('DatePopup resolves an inherited theme from the closest FabUI theme host', function() {
  var root = {
    classList: {
      contains: function(name) {
        return name === 'fg-theme-metro-orange';
      }
    },
    parentElement: null
  };
  var child = {
    classList: {
      contains: function() {
        return false;
      }
    },
    parentElement: root
  };
  assert.equal(findDatePopupTheme(child), 'metro-orange');
});

test('DatePopup formats traditional lunar day labels', function() {
  assert.equal(
    formatDatePopupLunarText(new Date(2026, 6, 1), 'zh-TW'),
    '十七'
  );
  assert.equal(
    formatDatePopupLunarText(new Date(2026, 6, 14), 'zh-TW'),
    '六月 初一'
  );
  assert.equal(
    formatDatePopupLunarText(new Date(2026, 6, 18), 'zh-TW'),
    '初五'
  );
});
