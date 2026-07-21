import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import EditBox, {
  EditBox as NamedEditBox,
  editorDefinitions
} from '../src/editbox/editbox.js';
import coreFabui from '../src/fabui.js';

var comboSource = readFileSync(
  new URL('../src/editbox/combo-editbox.js', import.meta.url),
  'utf8'
);
var numberSource = readFileSync(
  new URL('../src/editbox/number-editbox.js', import.meta.url),
  'utf8'
);
var numberStyle = readFileSync(
  new URL('../src/editbox/number-editbox.css', import.meta.url),
  'utf8'
);
var timeStyle = readFileSync(
  new URL('../src/editbox/time-editbox.css', import.meta.url),
  'utf8'
);

test('FabUI core publishes EditBox with shared editor definitions', function() {
  assert.equal(typeof coreFabui.EditBox, 'function');
  assert.equal(coreFabui.EditBox.editorDefinitions, coreFabui.editorDefinitions);
  assert.equal(coreFabui.FabGrid.editorDefinitions, coreFabui.editorDefinitions);
  assert.equal(
    coreFabui.FabGrid.editorDefinitions.time,
    coreFabui.EditBox.editorDefinitions.time
  );
});

test('EditBox exposes one class with simplified editor type names', function() {
  assert.equal(EditBox, NamedEditBox);
  assert.deepEqual(EditBox.editorTypes, [
    'text',
    'number',
    'time',
    'date',
    'combo',
    'color'
  ]);
  assert.deepEqual(Object.keys(EditBox.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(EditBox.themes.length, 19);
  assert.equal(typeof EditBox.prototype.setLocale, 'function');
});

test('EditBox owns the shared FabGrid editor definitions', function() {
  assert.equal(EditBox.editorDefinitions, editorDefinitions);
  assert.equal(EditBox.getEditorDefinition('text'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('number'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('time'), editorDefinitions.time);
  assert.equal(EditBox.getEditorDefinition('date'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combo'), editorDefinitions.combo);
  assert.ok(editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('color'), editorDefinitions.color);
});

test('EditBox accepts the same editor aliases as FabGrid', function() {
  assert.equal(EditBox.getEditorDefinition('textbox'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('numberbox'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('numeric'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('timebox'), editorDefinitions.time);
  assert.equal(EditBox.getEditorDefinition('datebox'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('calendar'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combobox'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('select'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('dropdown'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('colour'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colorbox'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colourbox'), editorDefinitions.color);
});

test('Combo EditBox expands its popup to fit long option text by default', function() {
  assert.match(comboSource, /fitContent:\s*true/);
  assert.match(
    comboSource,
    /fitContent:\s*this\._options\.fitContent/
  );
  assert.match(
    comboSource,
    /var booleanNames = \[[^\]]*'fitContent'/
  );
});

test('Number EditBox supports left and right spinner controls', function() {
  assert.match(numberSource, /spinner:\s*false/);
  assert.match(numberSource, /value === true[^\n]+right/);
  assert.match(numberSource, /String\(value\)\.toLowerCase\(\) === 'left'/);
  assert.match(numberSource, /self\._spin\(button === self\._increaseButton \? 1 : -1\)/);
  assert.match(numberSource, /key === 'ArrowUp' \? 1 : -1/);
  assert.match(numberSource, /this\._options\.increment/);
  assert.match(numberSource, /iconWidth:\s*28/);
  assert.match(numberStyle, /flex:\s*0 0 28px/);
  assert.match(numberStyle, /--fui-control-trigger-bg/);
  assert.match(numberStyle, /--fui-control-icon/);
  assert.equal(EditBox.locales.en.increaseValueText, 'Increase value');
  assert.equal(EditBox.locales['zh-TW'].decreaseValueText, '減少數值');
  assert.equal(EditBox.locales['zh-CN'].increaseValueText, '增加数值');
  assert.equal(EditBox.locales['zh-TW'].invalidTimeText, '請輸入有效時間。');
});

test('Time EditBox aligns input text to the left by default', function() {
  assert.match(timeStyle, /\.fui-timebox \.fui-textbox-text\s*\{[^}]*text-align:\s*left;/s);
});
