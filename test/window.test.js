import test from 'node:test';
import assert from 'node:assert/strict';
import coreFabui from '../src/fabui.js';
import {
  constrainWindowRect,
  normalizeWindowTheme
} from '../src/window/window.js';

test('FabUI core publishes Window', function() {
  assert.equal(typeof coreFabui.Window, 'function');
});

test('Window normalizes supported themes and aliases', function() {
  assert.equal(normalizeWindowTheme('material-teal'), 'material-teal');
  assert.equal(normalizeWindowTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeWindowTheme(' BLACK '), 'black');
  assert.equal(normalizeWindowTheme('unknown'), 'default');
});

test('Window constrain keeps size and position inside its bounds', function() {
  assert.deepEqual(
    constrainWindowRect(
      { left: -20, top: 250, width: 500, height: 40 },
      { width: 420, height: 300 },
      { width: 200, height: 100 }
    ),
    { left: 0, top: 200, width: 420, height: 100 }
  );
});

test('Window constrain yields to a viewport smaller than its configured minimum', function() {
  assert.deepEqual(
    constrainWindowRect(
      { left: 20, top: 10, width: 600, height: 400 },
      { width: 120, height: 70 },
      { width: 200, height: 100 }
    ),
    { left: 0, top: 0, width: 120, height: 70 }
  );
});

test('Window exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(coreFabui.Window.defaults.title, 'New Window');
  assert.equal(coreFabui.Window.defaults.draggable, true);
  assert.equal(coreFabui.Window.defaults.resizable, true);
  assert.equal(coreFabui.Window.defaults.collapsible, false);
  assert.equal(coreFabui.Window.defaults.minimizable, false);
  assert.equal(coreFabui.Window.defaults.maximizable, true);
  assert.equal(coreFabui.Window.defaults.closable, true);
  assert.equal(coreFabui.Window.defaults.modal, false);
  assert.equal(coreFabui.Window.defaults.animate, true);
  assert.equal(coreFabui.Window.defaults.animationDuration, 180);
});
