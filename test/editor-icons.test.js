import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEditorIconDescriptor,
  normalizeEditorIconDescriptors
} from '../src/editbox/editor-icons.js';

test('editor icon descriptor uses one canonical syntax', function() {
  var onClick = function() {};
  var icon = normalizeEditorIconDescriptor({
    iconCls: 'icon-refwin',
    title: 'Lookup',
    ariaLabel: 'Open lookup',
    text: '',
    width: 28,
    align: 'left',
    keepFocus: false,
    onClick: onClick
  });

  assert.equal(icon.iconCls, 'icon-refwin');
  assert.equal(icon.title, 'Lookup');
  assert.equal(icon.ariaLabel, 'Open lookup');
  assert.equal(icon.text, '');
  assert.equal(icon.width, 28);
  assert.equal(icon.align, 'left');
  assert.equal(icon.keepFocus, false);
  assert.equal(icon.onClick, onClick);
});

test('editor icon descriptor normalizes compatibility aliases once', function() {
  var handler = function() {};
  var icon = normalizeEditorIconDescriptor({
    iconClass: 'icon-search',
    label: 'Search',
    align: 'LEFT',
    handler: handler,
    builtin: 'lookup'
  });

  assert.equal(icon.iconCls, 'icon-search');
  assert.equal(icon.ariaLabel, 'Search');
  assert.equal(icon.align, 'left');
  assert.equal(icon.onClick, handler);
  assert.equal(icon.builtin, 'lookup');
});

test('editor icon descriptors accept the same shorthand in EditBox and FabGrid', function() {
  var onClick = function() {};
  var icons = normalizeEditorIconDescriptors([
    'icon-add',
    onClick,
    false,
    null
  ]);

  assert.equal(icons.length, 2);
  assert.equal(icons[0].iconCls, 'icon-add');
  assert.equal(icons[0].align, 'right');
  assert.equal(icons[1].onClick, onClick);
  assert.equal(icons[1].align, 'right');
});
