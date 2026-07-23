var controls = [];
var selectObservers = [];
var fabui = null;

function hasButtonControl(element) {
  var registered =
    fabui &&
    fabui.Control &&
    typeof fabui.Control.getControl === 'function' &&
    fabui.Control.getControl(element);
  return Boolean(
    element.__fabuiButton ||
    element.__fabuiMenuButton ||
    element.__fabuiSplitButton ||
    registered
  );
}

function hasFieldControl(element) {
  return Boolean(
    element.__fabuiEditBox ||
    element.__fabuiTextBox ||
    element.__fabuiCheckBox ||
    element.__fabuiCheckGroup ||
    element.__fabuiSwitchButton ||
    element.__fabuiRadioButton ||
    element.__fabuiRadioGroup ||
    element.__fabuiFileBox ||
    element.__fabuiHtmlEditor
  );
}

function isComponentInternal(element) {
  var parent = element.parentElement;
  if (!parent) return false;
  return Boolean(parent.closest(
    '.fui-button, .fui-textbox-field, .fui-checkbox, .fui-checkgroup, ' +
    '.fui-switchbutton, .fui-radiobutton, .fui-radiogroup, .fui-filebox, ' +
    '.fui-calendar, .fui-tabs, .fui-tree, .fui-menu, .fui-panel, ' +
    '.fui-window, .fui-layout, .fui-combobox-panel, .fui-colorbox-panel, ' +
    '.fui-datebox-panel, .fui-tooltip, .fui-form-validation-tip, ' +
    '.fui-messager-host, .fui-html-editor, .fg-root'
  ));
}

function measureElement(element) {
  var rect = element.getBoundingClientRect();
  var style = window.getComputedStyle(element);
  var width = rect.width || parseFloat(style.width) || 0;
  var height = rect.height || parseFloat(style.height) || 0;
  return {
    width: width > 0 ? Math.ceil(width) : null,
    height: height > 0 ? Math.ceil(height) : null
  };
}

function measureSelectContentWidth(select, control) {
  var textbox = control.textbox();
  var shell = textbox.closest('.fui-textbox');
  var trigger = shell.querySelector('.fui-combobox-arrow');
  var textboxStyle = window.getComputedStyle(textbox);
  var shellStyle = window.getComputedStyle(shell);
  var ruler = document.createElement('span');
  var textWidth = 0;
  var paddingWidth;
  var borderWidth;
  var triggerWidth;
  ruler.style.position = 'fixed';
  ruler.style.left = '-10000px';
  ruler.style.top = '-10000px';
  ruler.style.visibility = 'hidden';
  ruler.style.whiteSpace = 'pre';
  ruler.style.font = textboxStyle.font;
  ruler.style.letterSpacing = textboxStyle.letterSpacing;
  document.body.appendChild(ruler);
  Array.prototype.forEach.call(select.options, function(option) {
    ruler.textContent = option.textContent || '';
    textWidth = Math.max(textWidth, ruler.getBoundingClientRect().width);
  });
  ruler.remove();
  paddingWidth =
    (parseFloat(textboxStyle.paddingLeft) || 0) +
    (parseFloat(textboxStyle.paddingRight) || 0);
  borderWidth =
    (parseFloat(shellStyle.borderLeftWidth) || 0) +
    (parseFloat(shellStyle.borderRightWidth) || 0);
  triggerWidth = trigger ? trigger.getBoundingClientRect().width : 0;
  return Math.ceil(textWidth + paddingWidth + borderWidth + triggerWidth + 2);
}

function fitSelectWidth(select, control, initialWidth) {
  control.resize(
    Math.max(initialWidth || 0, measureSelectContentWidth(select, control))
  );
}

function dispatchSourceEvent(element, type) {
  element.dispatchEvent(new Event(type, { bubbles: true }));
}

function readSelectData(select) {
  var rows = [];
  Array.prototype.forEach.call(select.children, function(child) {
    var group = child.tagName === 'OPTGROUP' ? child.label : '';
    var options = child.tagName === 'OPTGROUP' ? child.children : [child];
    Array.prototype.forEach.call(options, function(option) {
      if (option.tagName !== 'OPTION') return;
      rows.push({
        value: option.value || option.textContent,
        text: option.textContent,
        group: group,
        disabled: option.disabled,
        selected: option.selected
      });
    });
  });
  return rows;
}

function mountSelect(select) {
  var size;
  var field;
  var syncing = false;
  var control;
  var observer;
  if (hasFieldControl(select) || isComponentInternal(select)) return;
  size = measureElement(select);
  control = new fabui.EditBox(select, {
    editor: 'combo',
    width: size.width,
    editable: false,
    limitToList: true,
    panelHeight: 'auto',
    theme: 'inherit',
    onChange: function() {
      if (syncing) return;
      syncing = true;
      dispatchSourceEvent(select, 'change');
      syncing = false;
    }
  });
  fitSelectWidth(select, control, size.width);
  field = control.textbox().closest('.fui-textbox-field');
  field.hidden = select.hidden;
  field.classList.add('fui-dev-control');
  select.__fabuiDevControl = control;
  select.addEventListener('change', function() {
    if (syncing) return;
    syncing = true;
    control.setValue(select.value, true);
    syncing = false;
  });
  observer = new MutationObserver(function() {
    field.hidden = select.hidden;
    control.loadData(readSelectData(select), true);
    control.setValue(select.value, true);
    fitSelectWidth(select, control, size.width);
  });
  observer.observe(select, {
    attributes: true,
    attributeFilter: ['hidden', 'disabled'],
    childList: true,
    subtree: true
  });
  selectObservers.push(observer);
  controls.push(control);
}

function mountButton(button) {
  var control;
  if (hasButtonControl(button) || isComponentInternal(button)) return;
  control = new fabui.Button(button, {
    iconCls: button.getAttribute('data-icon-cls') || '',
    theme: 'inherit',
    onClick: function() {
      var form;
      if (button.getAttribute('data-button-type') !== 'submit') return;
      form = button.closest('form');
      if (form) form.requestSubmit();
    }
  });
  button.__fabuiDevControl = control;
  controls.push(control);
}

function mountCheckBox(input) {
  var control;
  if (hasFieldControl(input) || isComponentInternal(input)) return;
  control = new fabui.CheckBox(input, {
    theme: 'inherit'
  });
  input.__fabuiDevControl = control;
  controls.push(control);
}

function mountRadioButton(input) {
  var control;
  if (hasFieldControl(input) || isComponentInternal(input)) return;
  control = new fabui.RadioButton(input, {
    theme: 'inherit'
  });
  input.__fabuiDevControl = control;
  controls.push(control);
}

function mountFileBox(input) {
  var size;
  var control;
  if (input.hidden || hasFieldControl(input) || isComponentInternal(input)) return;
  size = measureElement(input);
  control = new fabui.FileBox(input, {
    width: size.width,
    theme: 'inherit'
  });
  input.__fabuiDevControl = control;
  controls.push(control);
}

function mountEditBox(input) {
  var size;
  var type;
  var editor;
  var control;
  if (hasFieldControl(input) || isComponentInternal(input)) return;
  type = String(input.getAttribute('type') || 'text').toLowerCase();
  if (type === 'hidden' || type === 'range' || type === 'submit' || type === 'button') return;
  editor = type === 'number' ? 'number' :
    (type === 'date' || type === 'month' ? 'date' :
      (type === 'color' ? 'color' : 'text'));
  size = measureElement(input);
  control = new fabui.EditBox(input, {
    editor: editor,
    width: size.width,
    height: input.tagName === 'TEXTAREA' ? size.height : null,
    theme: 'inherit',
    onChange: function() {
      dispatchSourceEvent(input, 'input');
      dispatchSourceEvent(input, 'change');
    }
  });
  input.__fabuiDevControl = control;
  controls.push(control);
}

function syncThemes() {
  controls.forEach(function(control) {
    if (
      control instanceof fabui.EditBox &&
      (!control._control || typeof control._control.setTheme !== 'function')
    ) {
      return;
    }
    if (typeof control.setTheme === 'function') control.setTheme('inherit');
  });
}

export function mountFabUIDemoControls(fabuiApi, registryName) {
  fabui = fabuiApi;
  if (!fabui || !fabui.Button || !fabui.EditBox) return;
  document.body.classList.add('fabui-demo-controls');
  Array.prototype.forEach.call(document.querySelectorAll('select'), mountSelect);
  Array.prototype.forEach.call(
    document.querySelectorAll(
      'a[data-fabui-button], a[href="javascript:void(0)"], ' +
      'body.fabui-demo-index tbody a[href]'
    ),
    mountButton
  );
  Array.prototype.forEach.call(
    document.querySelectorAll('input[type="checkbox"]'),
    mountCheckBox
  );
  Array.prototype.forEach.call(
    document.querySelectorAll('input[type="radio"]'),
    mountRadioButton
  );
  Array.prototype.forEach.call(
    document.querySelectorAll('input[type="file"]'),
    mountFileBox
  );
  Array.prototype.forEach.call(
    document.querySelectorAll(
      'input:not([type]), input[type="text"], input[type="search"], ' +
      'input[type="email"], input[type="number"], input[type="date"], ' +
      'input[type="month"], input[type="color"], textarea'
    ),
    mountEditBox
  );
  new MutationObserver(syncThemes).observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
  window[registryName || 'fabuiDemoControls'] = {
    controls: controls,
    mount: mountFabUIDemoControls,
    observers: selectObservers
  };
}
