import test from 'node:test';
import assert from 'node:assert/strict';
import EditBox, {
  EditBox as NamedEditBox,
  editorDefinitions
} from '../src/editbox/editbox.js';

test('EditBox exposes one class with simplified editor type names', function() {
  assert.equal(EditBox, NamedEditBox);
  assert.deepEqual(EditBox.editorTypes, [
    'text',
    'number',
    'date',
    'combo',
    'color'
  ]);
});

test('EditBox owns the shared FabGrid editor definitions', function() {
  assert.equal(EditBox.editorDefinitions, editorDefinitions);
  assert.equal(EditBox.getEditorDefinition('text'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('number'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('date'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combo'), editorDefinitions.combo);
  assert.ok(editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('color'), editorDefinitions.color);
});

test('EditBox accepts the same editor aliases as FabGrid', function() {
  assert.equal(EditBox.getEditorDefinition('textbox'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('numberbox'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('numeric'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('datebox'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('calendar'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combobox'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('select'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('dropdown'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('colour'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colorbox'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colourbox'), editorDefinitions.color);
});
