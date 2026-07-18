import { createEditorDefinitions } from './editbox-definitions.js?v=20260717-editbox-v21';
import { createColorEditBoxFactory } from './color-editbox.js?v=20260718-final-audit-v1';
import { createTextBoxFactory } from './text-editbox.js?v=20260718-editor-icons-v1';
import { createNumberBoxFactory } from './number-editbox.js?v=20260717-editbox-v21';
import { createDateBoxFactory } from './date-editbox.js?v=20260718-final-audit-v1';
import { createComboBoxFactory } from './combo-editbox.js?v=20260718-final-audit-v1';

var EDITOR_TYPES = ['text', 'number', 'date', 'combo', 'color'];

function assignEditBoxOptions(target) {
  var index;
  var source;
  var key;
  for (index = 1; index < arguments.length; index += 1) {
    source = arguments[index] || {};
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function resolveElement(element) {
  return typeof element === 'string' ? document.querySelector(element) : element;
}

function normalizeEditorType(value) {
  var type = String(value == null ? '' : value).toLowerCase();
  if (type === 'text' || type === 'textbox') return 'text';
  if (type === 'number' || type === 'numberbox' || type === 'numeric') return 'number';
  if (type === 'date' || type === 'datebox' || type === 'calendar') return 'date';
  if (type === 'combo' || type === 'combobox' || type === 'select' || type === 'dropdown') return 'combo';
  if (type === 'colour' || type === 'colorbox' || type === 'colourbox') return 'color';
  return EDITOR_TYPES.indexOf(type) >= 0 ? type : '';
}

function normalizeDefinitionName(value) {
  return normalizeEditorType(value) || String(value == null ? '' : value).toLowerCase();
}

function inferEditorType(element, options) {
  var explicit = normalizeEditorType(
    options.editor || options.editType || options.kind
  );
  var inputType;
  if (explicit) return explicit;
  if (normalizeEditorType(options.type)) return normalizeEditorType(options.type);
  if (element && element.tagName === 'SELECT') return 'combo';
  inputType = element && element.getAttribute ? String(element.getAttribute('type') || '').toLowerCase() : '';
  if (inputType === 'number') return 'number';
  if (inputType === 'date' || inputType === 'month') return 'date';
  if (inputType === 'color') return 'color';
  return 'text';
}

export function createEditBoxFactory(editorDefinitions) {
  var definitions = editorDefinitions || createEditorDefinitions();
  var TextBox = createTextBoxFactory(definitions);
  var NumberBox = createNumberBoxFactory(TextBox, definitions);
  var DateBox = createDateBoxFactory(TextBox, definitions);
  var ComboBox = createComboBoxFactory(TextBox, definitions);
  var ColorEditBox = createColorEditBoxFactory(TextBox, definitions);
  var factories = {
    text: TextBox,
    number: NumberBox,
    date: DateBox,
    combo: ComboBox,
    color: ColorEditBox
  };

  function EditBox(element, options) {
    var childOptions;
    var factory;
    if (!(this instanceof EditBox)) {
      return new EditBox(element, options);
    }
    this._source = resolveElement(element);
    if (!this._source || !/^(INPUT|TEXTAREA|SELECT)$/.test(this._source.tagName)) {
      throw new Error('fabui.EditBox requires an input, textarea, or select element.');
    }
    if (this._source.__fabuiEditBox) {
      return this._source.__fabuiEditBox;
    }
    options = options || {};
    this._editorType = inferEditorType(this._source, options);
    factory = factories[this._editorType];
    if (!factory) {
      throw new Error('Unsupported fabui.EditBox editor: ' + String(options.editor || options.type || ''));
    }
    if (this._source.tagName === 'SELECT' && this._editorType !== 'combo') {
      throw new Error('fabui.EditBox select elements require editor "combo".');
    }
    childOptions = assignEditBoxOptions({}, options);
    delete childOptions.editor;
    delete childOptions.editType;
    delete childOptions.kind;
    if (normalizeEditorType(childOptions.type)) {
      delete childOptions.type;
    }
    childOptions.cls = 'fui-editbox' + (childOptions.cls ? ' ' + childOptions.cls : '');
    this._destroyed = false;
    this._control = new factory(this._source, childOptions);
    this._source.__fabuiEditBox = this;
  }

  EditBox.prototype.getEditorType = function() {
    return this._editorType;
  };

  EditBox.prototype.getDefinition = function(name) {
    return definitions[normalizeDefinitionName(name || this._editorType)] || null;
  };

  EditBox.prototype.options = function() {
    var options = this._control.options();
    options.editor = this._editorType;
    return options;
  };

  EditBox.prototype.textbox = function() {
    return this._control.textbox();
  };

  EditBox.prototype.button = function() {
    return typeof this._control.button === 'function' ? this._control.button() : null;
  };

  EditBox.prototype.panel = function() {
    return typeof this._control.panel === 'function' ? this._control.panel() : null;
  };

  EditBox.prototype.calendar = function() {
    return typeof this._control.calendar === 'function' ? this._control.calendar() : null;
  };

  EditBox.prototype.getIcon = function(index) {
    return this._control.getIcon(index);
  };

  EditBox.prototype.getText = function() {
    return this._control.getText();
  };

  EditBox.prototype.setText = function(value) {
    this._control.setText(value);
    return this;
  };

  EditBox.prototype.getValue = function() {
    return this._control.getValue();
  };

  EditBox.prototype.setValue = function(value, silent) {
    this._control.setValue(value, silent);
    return this;
  };

  EditBox.prototype.getNumber = function() {
    if (typeof this._control.getNumber !== 'function') return null;
    return this._control.getNumber();
  };

  EditBox.prototype.getDate = function() {
    if (typeof this._control.getDate !== 'function') return null;
    return this._control.getDate();
  };

  EditBox.prototype.getData = function() {
    if (typeof this._control.getData !== 'function') return [];
    return this._control.getData();
  };

  EditBox.prototype.getValues = function() {
    if (typeof this._control.getValues !== 'function') return [this.getValue()];
    return this._control.getValues();
  };

  EditBox.prototype.setValues = function(values, silent) {
    if (typeof this._control.setValues !== 'function') {
      return this.setValue(Array.isArray(values) ? values[0] : values, silent);
    }
    this._control.setValues(values, silent);
    return this;
  };

  EditBox.prototype.select = function(value) {
    if (typeof this._control.select !== 'function') {
      throw new Error('fabui.EditBox select() requires editor "combo".');
    }
    this._control.select(value);
    return this;
  };

  EditBox.prototype.unselect = function(value) {
    if (typeof this._control.unselect !== 'function') {
      throw new Error('fabui.EditBox unselect() requires editor "combo".');
    }
    this._control.unselect(value);
    return this;
  };

  EditBox.prototype.scrollTo = function(value) {
    if (typeof this._control.scrollTo !== 'function') {
      throw new Error('fabui.EditBox scrollTo() requires editor "combo".');
    }
    this._control.scrollTo(value);
    return this;
  };

  EditBox.prototype.setDate = function(value, silent) {
    if (typeof this._control.setDate !== 'function') {
      throw new Error('fabui.EditBox setDate() requires editor "date".');
    }
    this._control.setDate(value, silent);
    return this;
  };

  EditBox.prototype.initValue = function(value) {
    this._control.initValue(value);
    return this;
  };

  EditBox.prototype.clear = function() {
    this._control.clear();
    return this;
  };

  EditBox.prototype.reset = function() {
    this._control.reset();
    return this;
  };

  EditBox.prototype.focus = function() {
    this._control.focus();
    return this;
  };

  EditBox.prototype.resize = function(width, height) {
    this._control.resize(width, height);
    return this;
  };

  EditBox.prototype.disable = function() {
    this._control.disable();
    return this;
  };

  EditBox.prototype.enable = function() {
    this._control.enable();
    return this;
  };

  EditBox.prototype.readonly = function(mode) {
    this._control.readonly(mode);
    return this;
  };

  EditBox.prototype.setEditable = function(mode) {
    this._control.setEditable(mode);
    return this;
  };

  EditBox.prototype.setTheme = function(theme) {
    if (typeof this._control.setTheme !== 'function') {
      throw new Error('fabui.EditBox setTheme() requires editor "date".');
    }
    this._control.setTheme(theme);
    return this;
  };

  EditBox.prototype.fix = function() {
    if (typeof this._control.fix === 'function') this._control.fix();
    return this;
  };

  EditBox.prototype.showPanel = function() {
    if (typeof this._control.showPanel === 'function') this._control.showPanel();
    return this;
  };

  EditBox.prototype.hidePanel = function() {
    if (typeof this._control.hidePanel === 'function') this._control.hidePanel();
    return this;
  };

  EditBox.prototype.togglePanel = function() {
    if (typeof this._control.togglePanel === 'function') this._control.togglePanel();
    return this;
  };

  EditBox.prototype.loadData = function(data, silent) {
    if (typeof this._control.loadData !== 'function') {
      throw new Error('fabui.EditBox loadData() requires editor "combo".');
    }
    this._control.loadData(data, silent);
    return this;
  };

  EditBox.prototype.reload = function(urlOrParams) {
    if (typeof this._control.reload !== 'function') {
      throw new Error('fabui.EditBox reload() requires editor "combo".');
    }
    this._control.reload(urlOrParams);
    return this;
  };

  EditBox.prototype.cloneFrom = function(from) {
    var source = from instanceof EditBox ? from._control : from;
    if (typeof this._control.cloneFrom !== 'function') {
      throw new Error('fabui.EditBox cloneFrom() requires editor "date".');
    }
    this._control.cloneFrom(source);
    return this;
  };

  EditBox.prototype.on = function(name, listener) {
    this._control.on(name, listener);
    return this;
  };

  EditBox.prototype.off = function(name, listener) {
    this._control.off(name, listener);
    return this;
  };

  EditBox.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    delete this._source.__fabuiEditBox;
    this._control.destroy();
    this._control = null;
  };

  EditBox.prototype.dispose = EditBox.prototype.destroy;

  EditBox.editorDefinitions = definitions;
  EditBox.editorTypes = EDITOR_TYPES.slice();
  EditBox.getEditorDefinition = function(name) {
    return definitions[normalizeDefinitionName(name)] || null;
  };
  EditBox.getControl = function(element) {
    element = resolveElement(element);
    return element && element.__fabuiEditBox ? element.__fabuiEditBox : null;
  };
  return EditBox;
}

export var editorDefinitions = createEditorDefinitions();
export var EditBox = createEditBoxFactory(editorDefinitions);
export default EditBox;
