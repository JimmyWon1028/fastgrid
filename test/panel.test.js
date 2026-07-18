import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import coreFabui from '../src/fabui.js';
import {
  normalizePanelHalign,
  normalizePanelTheme
} from '../src/panel/panel.js';

test('FabUI core publishes Panel', function() {
  assert.equal(typeof coreFabui.Panel, 'function');
});

test('Panel normalizes supported themes and aliases', function() {
  assert.equal(normalizePanelTheme('material-teal'), 'material-teal');
  assert.equal(normalizePanelTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizePanelTheme(' BLACK '), 'black');
  assert.equal(normalizePanelTheme('unknown'), 'default');
});

test('Panel normalizes header alignment', function() {
  assert.equal(normalizePanelHalign('left'), 'left');
  assert.equal(normalizePanelHalign('RIGHT'), 'right');
  assert.equal(normalizePanelHalign('invalid'), 'top');
});

test('Panel exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(coreFabui.Panel.defaults.title, '');
  assert.equal(coreFabui.Panel.defaults.width, 'auto');
  assert.equal(coreFabui.Panel.defaults.height, 'auto');
  assert.equal(coreFabui.Panel.defaults.border, true);
  assert.equal(coreFabui.Panel.defaults.collapsible, false);
  assert.equal(coreFabui.Panel.defaults.minimizable, false);
  assert.equal(coreFabui.Panel.defaults.maximizable, false);
  assert.equal(coreFabui.Panel.defaults.closable, false);
  assert.equal(coreFabui.Panel.defaults.cache, true);
  assert.equal(coreFabui.Panel.defaults.animate, true);
  assert.equal(coreFabui.Panel.defaults.animationDuration, 180);
});

test('Panel default extractor returns body content when present', function() {
  assert.equal(
    coreFabui.Panel.defaults.extractor('<html><body><strong>Panel</strong></body></html>'),
    '<strong>Panel</strong>'
  );
});

test('Panel state changes use shared reduced-motion aware transitions', function() {
  var source = readFileSync(new URL('../src/panel/panel.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/panel/panel.css', import.meta.url), 'utf8');
  assert.match(source, /_getAnimationDuration/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /FabPanel\.prototype\.maximize[\s\S]*?_animateState/);
  assert.match(source, /FabPanel\.prototype\.restore[\s\S]*?_animateState/);
  assert.match(source, /FabPanel\.prototype\.collapse[\s\S]*?_animateState/);
  assert.match(source, /FabPanel\.prototype\.expand[\s\S]*?_animateState/);
  assert.match(css, /\.fui-panel-transitioning/);
  assert.match(css, /height var\(--fui-panel-animation-duration\)/);
  assert.match(css, /\.fui-panel-content-hidden/);
  assert.match(css, /\.fui-panel-collapsed\.fui-panel-halign-top[\s\S]*?height: fit-content !important/);
  assert.match(css, /\.fui-panel-collapsed\.fui-panel-halign-left[\s\S]*?width: fit-content !important/);
});
