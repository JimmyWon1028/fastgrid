import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditorDefinitions } from '../src/editor/editor-definitions.js';

test('color editor normalizes supported hex formats', function() {
  var color = createEditorDefinitions().color;

  assert.equal(color.normalize('#f00'), '#ff0000');
  assert.equal(color.normalize('0f08'), '#00ff0088');
  assert.equal(color.normalize('#123456'), '#123456');
  assert.equal(color.normalize('#123456cc'), '#123456cc');
});

test('color editor resolves CSS named colors without converting stored text', function() {
  var color = createEditorDefinitions().color;

  assert.equal(color.normalize('red'), '#ff0000');
  assert.equal(color.normalize('BlueViolet'), '#8a2be2');
  assert.equal(color.normalize('rebeccapurple'), '#663399');
  assert.equal(color.normalize('transparent'), '#00000000');
  assert.equal(color.parse('lightgreen'), 'lightgreen');
  assert.equal(color.parse('BlueViolet'), 'BlueViolet');
  assert.equal(color.isValid('navy'), true);
});

test('color editor preserves invalid text for grid validation', function() {
  var color = createEditorDefinitions().color;

  assert.equal(color.normalize('not-a-color'), '');
  assert.equal(color.parse('not-a-color'), 'not-a-color');
  assert.equal(color.isValid('not-a-color'), false);
  assert.equal(color.isValid(''), true);
});

test('datebox copy removes mask literals by default', function() {
  var datebox = createEditorDefinitions().datebox;

  assert.equal(datebox.getCopyText('2026/07/17', { mask: '9999/99/99' }), '20260717');
  assert.equal(datebox.getCopyText('2026/07', { mask: '9999/99' }), '202607');
  assert.equal(
    datebox.getCopyText('2026/07/17', {
      mask: '9999/99/99',
      autoUnmask: false
    }),
    '2026/07/17'
  );
});
