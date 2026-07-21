import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditorDefinitions } from '../src/editor/editor-definitions.js';

test('editor definitions expose simplified names with legacy aliases', function() {
  var definitions = createEditorDefinitions();
  assert.equal(definitions.text, definitions.textbox);
  assert.equal(definitions.number, definitions.numberbox);
  assert.equal(definitions.time, definitions.timebox);
  assert.equal(definitions.date, definitions.datebox);
  assert.equal(definitions.combo, definitions.combobox);
  assert.equal(definitions.text.type, 'text');
  assert.equal(definitions.number.type, 'number');
  assert.equal(definitions.time.type, 'time');
  assert.equal(definitions.date.type, 'date');
  assert.equal(definitions.combo.type, 'combo');
});

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

test('number spinner definition is shared by EditBox and FabGrid', function() {
  var number = createEditorDefinitions().number;
  assert.equal(number.normalizeSpinner(false), false);
  assert.equal(number.normalizeSpinner(true), 'right');
  assert.equal(number.normalizeSpinner('right'), 'right');
  assert.equal(number.normalizeSpinner('left'), 'left');
  assert.equal(number.getSpinValue('1.25', 1, { increment: 0.25, precision: 2 }), 1.5);
  assert.equal(number.getSpinValue(10, 1, { increment: 2, max: 10 }), 10);
  assert.equal(number.getSpinValue(0, -1, { increment: 2, min: 0 }), 0);
});

test('time editor enforces the standard 24-hour upper bound', function() {
  var time = createEditorDefinitions().time;
  assert.equal(time.mask, '99:99');
  assert.equal(time.format('0930', {}), '09:30');
  assert.equal(time.format('235959', { mask: '99:99:99' }), '23:59:59');
  assert.equal(time.isValid('23:59', {}), true);
  assert.equal(time.isValid('24:00', {}), true);
  assert.equal(time.isValid('24:01', {}), false);
  assert.equal(time.isValid('23:60', {}), false);
  assert.equal(time.isValid('24:00:00', { mask: '99:99:99' }), true);
  assert.equal(time.isValid('24:00:01', { mask: '99:99:99' }), false);
  assert.equal(time.getDataValue('09:30', {}), '0930');
  assert.equal(time.getDataValue('09:30', { autoUnmask: false }), '09:30');
});

test('time spinner adjusts the segment under the caret', function() {
  var time = createEditorDefinitions().time;
  var seconds = { mask: '99:99:99' };
  assert.equal(time.getSegmentAtCaret(1, seconds), 0);
  assert.equal(time.getSegmentAtCaret(4, seconds), 1);
  assert.equal(time.getSegmentAtCaret(7, seconds), 2);
  assert.equal(time.getSpinValue('12:34:56', 0, 1, seconds), '13:34:56');
  assert.equal(time.getSpinValue('12:34:56', 1, 1, seconds), '12:35:56');
  assert.equal(time.getSpinValue('12:34:56', 2, -1, seconds), '12:34:55');
  assert.equal(time.getSpinValue('23:59:59', 0, 1, seconds), '24:00:00');
  assert.equal(time.getSpinValue('24:00:00', 1, 1, seconds), '24:00:00');
});
