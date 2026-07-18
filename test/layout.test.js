import test from 'node:test';
import assert from 'node:assert/strict';
import coreFabui from '../src/fabui.js';
import {
  calculateLayoutRects,
  normalizeLayoutRegion
} from '../src/layout/layout.js';

test('FabUI core publishes Layout', function() {
  assert.equal(typeof coreFabui.Layout, 'function');
});

test('Layout normalizes the five supported regions', function() {
  assert.equal(normalizeLayoutRegion('NORTH'), 'north');
  assert.equal(normalizeLayoutRegion('center'), 'center');
  assert.equal(normalizeLayoutRegion('invalid'), null);
});

test('Layout calculates docked region and splitter rectangles', function() {
  var rects = calculateLayoutRects(
    { width: 800, height: 600 },
    {
      north: { exists: true, size: 80, split: true, splitSize: 5 },
      south: { exists: true, size: 60, split: false },
      west: { exists: true, size: 180, split: true, splitSize: 5 },
      east: { exists: true, size: 140, split: true, splitSize: 5 },
      center: { exists: true }
    }
  );
  assert.deepEqual(rects.north, { left: 0, top: 0, width: 800, height: 80 });
  assert.deepEqual(rects.northSplitter, { left: 0, top: 80, width: 800, height: 5 });
  assert.deepEqual(rects.west, { left: 0, top: 85, width: 180, height: 455 });
  assert.deepEqual(rects.east, { left: 660, top: 85, width: 140, height: 455 });
  assert.deepEqual(rects.center, { left: 185, top: 85, width: 470, height: 455 });
});

test('Layout reserves collapsed edge size without a splitter', function() {
  var rects = calculateLayoutRects(
    { width: 500, height: 300 },
    {
      west: {
        exists: true,
        collapsed: true,
        collapsedSize: 28,
        split: true,
        splitSize: 5
      },
      center: { exists: true }
    }
  );
  assert.deepEqual(rects.west, { left: 0, top: 0, width: 28, height: 300 });
  assert.equal(rects.westSplitter, undefined);
  assert.deepEqual(rects.center, { left: 28, top: 0, width: 472, height: 300 });
});

test('Layout exposes EasyUI-compatible region defaults', function() {
  assert.equal(coreFabui.Layout.defaults.fit, false);
  assert.equal(coreFabui.Layout.regionDefaults.split, false);
  assert.equal(coreFabui.Layout.regionDefaults.collapsible, true);
  assert.equal(coreFabui.Layout.regionDefaults.expandMode, 'float');
  assert.equal(coreFabui.Layout.regionDefaults.collapsedSize, 28);
  assert.equal(coreFabui.Layout.defaults.animate, true);
  assert.equal(coreFabui.Layout.defaults.animationDuration, 180);
});
