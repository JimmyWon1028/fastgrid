import test from 'node:test';
import assert from 'node:assert/strict';

import fabui from '../src/fabui.js';
import {
  createTooltipFactory,
  normalizeTooltipPosition,
  normalizeTooltipTheme,
  normalizeTooltipValign
} from '../src/tooltip/tooltip.js';

test('FabUI core publishes Tooltip', function() {
  assert.equal(typeof fabui.Tooltip, 'function');
});

test('Tooltip exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.Tooltip.defaults.position, 'bottom');
  assert.equal(fabui.Tooltip.defaults.valign, 'middle');
  assert.equal(fabui.Tooltip.defaults.content, null);
  assert.equal(fabui.Tooltip.defaults.trackMouse, false);
  assert.equal(fabui.Tooltip.defaults.deltaX, 0);
  assert.equal(fabui.Tooltip.defaults.deltaY, 0);
  assert.equal(fabui.Tooltip.defaults.showEvent, 'mouseenter');
  assert.equal(fabui.Tooltip.defaults.hideEvent, 'mouseleave');
  assert.equal(fabui.Tooltip.defaults.showDelay, 200);
  assert.equal(fabui.Tooltip.defaults.hideDelay, 100);
});

test('Tooltip normalizes themes, positions and vertical alignment', function() {
  assert.equal(normalizeTooltipTheme('material-teal'), 'material-teal');
  assert.equal(normalizeTooltipTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeTooltipTheme('unknown'), 'default');
  assert.equal(normalizeTooltipPosition('LEFT'), 'left');
  assert.equal(normalizeTooltipPosition('unknown'), 'bottom');
  assert.equal(normalizeTooltipValign('top'), 'top');
  assert.equal(normalizeTooltipValign('unknown'), 'middle');
});

test('Tooltip factory returns a public Control class', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  var Tooltip = createTooltipFactory(Control, function() {}, function() {});
  assert.equal(typeof Tooltip, 'function');
  assert.equal(Tooltip.defaults.position, 'bottom');
  assert.equal(Tooltip.normalizeTheme('sunny'), 'sunny');
});
