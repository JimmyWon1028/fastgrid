export function installFabGridEditorRuntime(FabGrid, context) {
  var applyMask = context.applyMask;
  var clamp = context.clamp;
  var closest = context.closest;
  var countMaskCharactersBeforeCaret = context.countMaskCharactersBeforeCaret;
  var editorDefinitions = context.editorDefinitions;
  var escapeHtml = context.escapeHtml;
  var extractMaskCharacters = context.extractMaskCharacters;
  var formatDateIso = context.formatDateIso;
  var formatDateboxEditorText = context.formatDateboxEditorText;
  var formatLocaleText = context.formatLocaleText;
  var formatMaskText = context.formatMaskText;
  var formatNumberEditorText = context.formatNumberEditorText;
  var formatYearMonthDataText = context.formatYearMonthDataText;
  var formatYearMonthEditorText = context.formatYearMonthEditorText;
  var getByBinding = context.getByBinding;
  var getColorPalette = context.getColorPalette;
  var getColorShowAlpha = context.getColorShowAlpha;
  var getColumnEditorConfig = context.getColumnEditorConfig;
  var getComboboxData = context.getComboboxData;
  var getComboboxDataValue = context.getComboboxDataValue;
  var getComboboxItemText = context.getComboboxItemText;
  var getComboboxItemValue = context.getComboboxItemValue;
  var getComboboxTextByValue = context.getComboboxTextByValue;
  var getDateboxDataValue = context.getDateboxDataValue;
  var getEditorIconConfigWidth = context.getEditorIconConfigWidth;
  var getEditorIconConfigs = context.getEditorIconConfigs;
  var getEditorMask = context.getEditorMask;
  var getExplicitEditorMask = context.getExplicitEditorMask;
  var getMaskCaretPosition = context.getMaskCaretPosition;
  var getMaskCopyText = context.getMaskCopyText;
  var getMaskDataValue = context.getMaskDataValue;
  var getMaskOptions = context.getMaskOptions;
  var getNumberCopyText = context.getNumberCopyText;
  var getNumberPrecision = context.getNumberPrecision;
  var getValidationRowId = context.getValidationRowId;
  var hasClass = context.hasClass;
  var isColorValueValid = context.isColorValueValid;
  var isComboboxValueInList = context.isComboboxValueInList;
  var isDateLikeEditorType = context.isDateLikeEditorType;
  var isDigitKey = context.isDigitKey;
  var isNumberEditorTextAllowed = context.isNumberEditorTextAllowed;
  var isPromiseLike = context.isPromiseLike;
  var isSafeBinding = context.isSafeBinding;
  var isYearMonthDateboxConfig = context.isYearMonthDateboxConfig;
  var isYearMonthDateboxTarget = context.isYearMonthDateboxTarget;
  var mergeOptions = context.mergeOptions;
  var normalizeClassName = context.normalizeClassName;
  var normalizeColorValue = context.normalizeColorValue;
  var normalizeTextAlign = context.normalizeTextAlign;
  var normalizeValidationResult = context.normalizeValidationResult;
  var parseColorValue = context.parseColorValue;
  var parseDateValue = context.parseDateValue;
  var parseDateboxEditorValue = context.parseDateboxEditorValue;
  var parseValue = context.parseValue;
  var parseYearMonthValue = context.parseYearMonthValue;
  var roundNumberValue = context.roundNumberValue;
  var sanitizeDateEditorText = context.sanitizeDateEditorText;
  var sanitizeNumberEditorText = context.sanitizeNumberEditorText;
  var setByBinding = context.setByBinding;
  var shouldUseThousandsSeparator = context.shouldUseThousandsSeparator;
  var toNumber = context.toNumber;
  var trimText = context.trimText;

  function getEditorCssType(type) {
    if (type === 'text') return 'textbox';
    if (type === 'number') return 'numberbox';
    if (type === 'date') return 'datebox';
    if (type === 'combo') return 'combobox';
    return type;
  }

  function getEditorSpinner(config) {
    var definition = config ? editorDefinitions[config.type] || null : null;
    var options = config && config.options ? config.options : {};
    if (!config || (config.type !== 'number' && config.type !== 'time')) return false;
    if (definition && typeof definition.normalizeSpinner === 'function') {
      return definition.normalizeSpinner(options.spinner);
    }
    if (options.spinner === true || String(options.spinner).toLowerCase() === 'right') return 'right';
    if (String(options.spinner).toLowerCase() === 'left') return 'left';
    return false;
  }

  function getEditorSpinnerWidth(config) {
    var options = config && config.options ? config.options : {};
    return Math.max(18, toNumber(options.iconWidth, 28));
  }

  function getNumberSpinOptions(column, config) {
    return mergeOptions(config && config.options ? config.options : {}, {
      precision: getNumberPrecision(column),
      thousandsSeparator: shouldUseThousandsSeparator(column)
    });
  }

  FabGrid.prototype.startEditing = function(row, col, options) {
    var column = this.visibleColumns[col];
    var item = this.view[row];
    var args;
    var value;
    var shouldSelectRow = !options || options.selectRow !== false;
    if (!this.isCellEditable(row, col) || !item) {
      return false;
    }
    args = { row: row, col: col, column: column, item: item };
    if (this.emit('beginningEdit', args) === false) {
      return false;
    }
    if (this.emit('cellEditStarting', args) === false) {
      return false;
    }
    value = getByBinding(item, column.binding);
    if (shouldSelectRow) {
      this.rowSelection = row;
      if (this.options.multiSelectRows === true) {
        this.selectedRowMap[row] = true;
        this.setItemSelectionState(item, true);
      }
    }
    this.selection = { row: row, col: col };
    this.editorConfig = getColumnEditorConfig(column);
    this.editing = { row: row, col: col, item: item, original: value, editor: this.editorConfig };
    this.configureEditor(column);
    this.editor.value = this.getEditorText(value, column);
    this.updateEditorSpinnerState();
    if (this.editorConfig.type === 'combo') {
      this.editing.comboboxValue = value;
    }
    if (this.editorConfig.type === 'color') {
      this.syncColorEditorAppearance();
    }
    this.editor.style.textAlign = normalizeTextAlign(column.align);
    this.editor.style.display = 'block';
    this.render();
    this.positionEditor();
    this.editor.focus();
    this.editor.select();
    return true;
  };

  FabGrid.prototype.configureEditor = function(column) {
    var config = getColumnEditorConfig(column);
    var type = config.type;
    var definition = editorDefinitions[type] || null;
    var editorClassName = definition && definition.className ? definition.className : 'textbox-f fg-editor-' + type + ' ' + type + '-f';
    var hasBuiltInEditorIcon = isDateLikeEditorType(type) || type === 'combo' || type === 'color';
    var iconConfigs = hasBuiltInEditorIcon ? [] : getEditorIconConfigs(config);
    var spinner = getEditorSpinner(config);
    var spinnerWidth = spinner ? getEditorSpinnerWidth(config) : 0;
    var editorIconWidth = getEditorIconConfigWidth(iconConfigs, type) + spinnerWidth;
    var hasEditorIcons = hasBuiltInEditorIcon || iconConfigs.length > 0 || Boolean(spinner);
    this.editorConfig = config;
    this.editorIconConfigs = iconConfigs;
    this.editorSpinnerPosition = spinner;
    this.editorIconHostWidth = editorIconWidth;
    this.renderEditorIcons(type, iconConfigs, spinner, spinnerWidth);
    this.editor.className = 'fg-editor ' + editorClassName + (hasEditorIcons ? ' fg-editor-with-icons' : '');
    this.editor.setAttribute('data-editor-type', type);
    this.editor.setAttribute('autocomplete', 'off');
    this.editor.type = 'text';
    this.editor.inputMode = definition && definition.inputMode ? definition.inputMode : (isDateLikeEditorType(type) ? 'numeric' : 'text');
    this.editor.style.paddingLeft = spinner === 'left' ? (editorIconWidth + 6) + 'px' : '';
    this.editor.style.paddingRight = hasEditorIcons && spinner !== 'left' ? (editorIconWidth + 6) + 'px' : '';
    this.editorIconHost.style.display = hasEditorIcons ? 'flex' : 'none';
    this.editorIconHost.className = 'fg-editor-icons' + (spinner === 'left' ? ' fg-editor-icons-left' : '');
    if (spinner) {
      this.editor.setAttribute('role', 'spinbutton');
    } else {
      this.editor.removeAttribute('role');
      this.editor.removeAttribute('aria-valuemin');
      this.editor.removeAttribute('aria-valuemax');
      this.editor.removeAttribute('aria-valuenow');
      this.editor.removeAttribute('aria-valuetext');
    }
    if (!isDateLikeEditorType(type)) {
      this.hideDateboxPanel();
    }
    if (type !== 'combo') {
      this.hideComboboxPanel();
    }
    if (type !== 'color') {
      this.hideColorPanel();
    }
  };

  FabGrid.prototype.renderEditorIcons = function(type, iconConfigs, spinner, spinnerWidth) {
    var fragment = document.createDocumentFragment();
    var button;
    var icon;
    var spinnerElement;
    var increaseButton;
    var decreaseButton;
    var options = this.editorConfig && this.editorConfig.options ? this.editorConfig.options : {};
    var i;
    this.editorIconHost.innerHTML = '';
    this.editorSpinner = null;
    this.editorSpinnerIncrease = null;
    this.editorSpinnerDecrease = null;
    if (iconConfigs && iconConfigs.length) {
      for (i = 0; i < iconConfigs.length; i += 1) {
        icon = iconConfigs[i];
        button = document.createElement('button');
        button.type = 'button';
        button.className = trimText('fg-editor-trigger fg-editor-trigger-custom ' + normalizeClassName(icon.iconCls));
        button.setAttribute('data-icon-index', i);
        button.setAttribute('aria-label', icon.ariaLabel || this.getText('aria.cellEditor'));
        button.title = icon.title || '';
        button.textContent = icon.text || '';
        button.style.width = Math.max(18, toNumber(icon.width, 22)) + 'px';
        fragment.appendChild(button);
      }
    } else if (isDateLikeEditorType(type) || type === 'combo' || type === 'color') {
      button = document.createElement('button');
      button.type = 'button';
      button.className = trimText('fg-editor-trigger fg-editor-trigger-' + getEditorCssType(type) + (isDateLikeEditorType(type) ? ' icon-datebox' : ''));
      button.setAttribute('aria-label', this.getEditorTriggerLabel());
      button.style.width = '22px';
      fragment.appendChild(button);
    }
    if (spinner) {
      spinnerElement = document.createElement('span');
      increaseButton = document.createElement('button');
      decreaseButton = document.createElement('button');
      spinnerElement.className = 'fui-numberbox-spinner fui-numberbox-spinner-' + spinner +
        (type === 'time' ? ' fui-timebox-spinner fg-editor-time-spinner' : ' fg-editor-number-spinner');
      spinnerElement.style.width = spinnerWidth + 'px';
      spinnerElement.style.flexBasis = spinnerWidth + 'px';
      increaseButton.type = 'button';
      increaseButton.className = 'fui-numberbox-spinner-button fui-numberbox-spinner-up fg-editor-spinner-button';
      increaseButton.setAttribute('data-spin-direction', '1');
      increaseButton.title = options.increaseValueText || this.getText('aria.increaseValue');
      increaseButton.setAttribute('aria-label', increaseButton.title);
      decreaseButton.type = 'button';
      decreaseButton.className = 'fui-numberbox-spinner-button fui-numberbox-spinner-down fg-editor-spinner-button';
      decreaseButton.setAttribute('data-spin-direction', '-1');
      decreaseButton.title = options.decreaseValueText || this.getText('aria.decreaseValue');
      decreaseButton.setAttribute('aria-label', decreaseButton.title);
      spinnerElement.appendChild(increaseButton);
      spinnerElement.appendChild(decreaseButton);
      if (spinner === 'left') {
        fragment.insertBefore(spinnerElement, fragment.firstChild);
      } else {
        fragment.appendChild(spinnerElement);
      }
      this.editorSpinner = spinnerElement;
      this.editorSpinnerIncrease = increaseButton;
      this.editorSpinnerDecrease = decreaseButton;
    }
    this.editorIconHost.appendChild(fragment);
    this.editorTrigger = this.editorIconHost.querySelector('.fg-editor-trigger');
  };

  FabGrid.prototype.spinEditorValue = function(direction) {
    var column;
    var config;
    var definition;
    var options;
    var current;
    var nextValue;
    var segment;
    if (!this.editing || !this.editorSpinner) {
      return false;
    }
    column = this.visibleColumns[this.editing.col];
    config = column ? getColumnEditorConfig(column) : this.editorConfig;
    definition = config ? editorDefinitions[config.type] || null : null;
    if (!column || !config || !getEditorSpinner(config) || !definition || typeof definition.getSpinValue !== 'function') {
      return false;
    }
    if (config.type === 'time') {
      options = mergeOptions(config.options || {}, { mask: getEditorMask(column) });
      segment = typeof definition.getSegmentAtCaret === 'function' ?
        definition.getSegmentAtCaret(this.editor.selectionStart, options) : 0;
      nextValue = definition.getSpinValue(this.editor.value, segment, direction, options);
      this.editor.value = nextValue;
      this.updateEditorSpinnerState();
      this.editor.focus();
      this.selectTimeEditorSegment(segment);
      return true;
    }
    options = getNumberSpinOptions(column, config);
    current = typeof definition.parse === 'function' ? definition.parse(this.editor.value, options) : Number(this.editor.value);
    nextValue = definition.getSpinValue(current, direction, options);
    this.editor.value = formatNumberEditorText(nextValue, shouldUseThousandsSeparator(column), getNumberPrecision(column));
    this.updateEditorSpinnerState();
    this.editor.focus();
    this.editor.select();
    return true;
  };

  FabGrid.prototype.updateEditorSpinnerState = function() {
    var column;
    var config;
    var definition;
    var options;
    var value;
    var min;
    var max;
    if (!this.editorSpinner || !this.editing) return;
    column = this.visibleColumns[this.editing.col];
    config = column ? getColumnEditorConfig(column) : this.editorConfig;
    definition = config ? editorDefinitions[config.type] || null : null;
    if (!definition) return;
    if (config.type === 'time') {
      this.editorSpinnerIncrease.disabled = false;
      this.editorSpinnerDecrease.disabled = false;
      this.editor.removeAttribute('aria-valuemin');
      this.editor.removeAttribute('aria-valuemax');
      this.editor.removeAttribute('aria-valuenow');
      this.editor.setAttribute('aria-valuetext', this.editor.value);
      return;
    }
    this.editor.removeAttribute('aria-valuetext');
    options = getNumberSpinOptions(column, config);
    value = typeof definition.parse === 'function' ? definition.parse(this.editor.value, options) : Number(this.editor.value);
    min = options.min == null || options.min === '' ? null : Number(options.min);
    max = options.max == null || options.max === '' ? null : Number(options.max);
    this.editorSpinnerIncrease.disabled = max != null && isFinite(max) && value != null && value >= max;
    this.editorSpinnerDecrease.disabled = min != null && isFinite(min) && value != null && value <= min;
    if (min != null && isFinite(min)) this.editor.setAttribute('aria-valuemin', String(min));
    else this.editor.removeAttribute('aria-valuemin');
    if (max != null && isFinite(max)) this.editor.setAttribute('aria-valuemax', String(max));
    else this.editor.removeAttribute('aria-valuemax');
    if (value != null && isFinite(value)) this.editor.setAttribute('aria-valuenow', String(value));
    else this.editor.removeAttribute('aria-valuenow');
  };

  FabGrid.prototype.handleNumberSpinnerKeyDown = function(event) {
    if (!this.editorSpinner || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return false;
    event.preventDefault();
    this.spinEditorValue(event.key === 'ArrowUp' ? 1 : -1);
    return true;
  };

  FabGrid.prototype.selectTimeEditorSegment = function(segment) {
    var ranges = [[0, 2], [3, 5], [6, 8]];
    var range = ranges[segment] || ranges[0];
    if (!this.editor || !this.editor.setSelectionRange) return;
    this.editor.setSelectionRange(
      Math.min(range[0], this.editor.value.length),
      Math.min(range[1], this.editor.value.length)
    );
  };

  FabGrid.prototype.getEditorText = function(value, column) {
    var config = getColumnEditorConfig(column);
    var mask = getExplicitEditorMask(column);
    var definition = editorDefinitions[config.type] || null;
    if (value == null) {
      return '';
    }
    if (config.type === 'time' && definition && typeof definition.format === 'function') {
      return definition.format(value, mergeOptions(config.options || {}, { mask: getEditorMask(column) }));
    }
    if (mask) {
      return formatMaskText(value, getMaskOptions(column, mask));
    }
    if (config.type === 'number') {
      return formatNumberEditorText(value, shouldUseThousandsSeparator(column), getNumberPrecision(column));
    }
    if (config.type === 'date') {
      return formatDateboxEditorText(value, config, column);
    }
    if (config.type === 'combo') {
      return getComboboxTextByValue(value, config);
    }
    if (config.type === 'color') {
      return parseColorValue(value);
    }
    return String(value);
  };

  FabGrid.prototype.shouldBlockEditorKey = function(event) {
    var edit = this.editing;
    var column;
    var config;
    var key;
    if (!edit || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
      return false;
    }
    key = event.key || '';
    if (key.length !== 1) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return false;
    }
    config = getColumnEditorConfig(column);
    if (isDateLikeEditorType(config.type) || config.type === 'time') {
      if (editorDefinitions[config.type] && typeof editorDefinitions[config.type].isTextAllowed === 'function') {
        return !editorDefinitions[config.type].isTextAllowed(this.editor, key, config.options || {});
      }
      return !isDigitKey(key);
    }
    if (config.type === 'number') {
      return !isNumberEditorTextAllowed(this.editor, key);
    }
    return false;
  };

  FabGrid.prototype.handleMaskedEditorDelete = function(event) {
    var edit = this.editing;
    var column;
    var mask;
    var raw;
    var start;
    var end;
    var deleteStart;
    var deleteEnd;
    var nextRaw;
    var nextText;
    var nextCaret;
    if (!edit || (event.key !== 'Backspace' && event.key !== 'Delete')) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    mask = getEditorMask(column);
    if (!column || !mask) {
      return false;
    }
    var dateDefinition = editorDefinitions[getColumnEditorConfig(column).type];
    if ((isDateLikeEditorType(getColumnEditorConfig(column).type) || getColumnEditorConfig(column).type === 'time') &&
      dateDefinition && typeof dateDefinition.handleDelete === 'function') {
      event.preventDefault();
      dateDefinition.handleDelete(this.editor, event.key, mergeOptions(getColumnEditorConfig(column).options || {}, { mask: mask }));
      return true;
    }
    event.preventDefault();
    start = this.editor.selectionStart == null ? this.editor.value.length : this.editor.selectionStart;
    end = this.editor.selectionEnd == null ? start : this.editor.selectionEnd;
    raw = extractMaskCharacters(this.editor.value, mask);
    deleteStart = countMaskCharactersBeforeCaret(this.editor.value, mask, start);
    deleteEnd = countMaskCharactersBeforeCaret(this.editor.value, mask, end);
    if (start === end) {
      if (event.key === 'Backspace') {
        if (deleteStart <= 0) {
          return true;
        }
        deleteStart -= 1;
      } else if (deleteStart >= raw.length) {
        return true;
      } else {
        deleteEnd += 1;
      }
    }
    nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
    nextText = applyMask(nextRaw, mask);
    nextCaret = getMaskCaretPosition(nextText, mask, deleteStart);
    this.editor.value = nextText;
    this.editor.setSelectionRange(nextCaret, nextCaret);
    return true;
  };

  FabGrid.prototype.handleEditorBeforeInput = function(event) {
    var edit = this.editing;
    var column;
    var config;
    var text;
    if (!edit || event.isComposing || event.data == null) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return;
    }
    config = getColumnEditorConfig(column);
    text = String(event.data);
    if ((isDateLikeEditorType(config.type) || config.type === 'time') && /[^0-9]/.test(text)) {
      event.preventDefault();
      return;
    }
    if (config.type === 'number' && !isNumberEditorTextAllowed(this.editor, text)) {
      event.preventDefault();
    }
  };

  FabGrid.prototype.handleEditorInput = function() {
    var edit = this.editing;
    var column;
    var config;
    var formatted;
    var mask;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    config = column ? getColumnEditorConfig(column) : null;
    mask = getEditorMask(column);
    if (mask) {
      if (config && config.type === 'time' && editorDefinitions.time && typeof editorDefinitions.time.format === 'function') {
        formatted = editorDefinitions.time.format(this.editor.value, mergeOptions(config.options || {}, { mask: mask }));
      } else {
        formatted = formatMaskText(this.editor.value, { mask: mask });
      }
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      if (config && isDateLikeEditorType(config.type)) {
        this.syncDateboxPanelToEditor();
      }
      if (config && config.type === 'time' && this.editorSpinner) {
        this.updateEditorSpinnerState();
      }
      return;
    }
    if (!column || !config) {
      return;
    }
    if (config.type === 'color') {
      this.syncColorEditorAppearance();
      if (this.isColorPanelOpen() && normalizeColorValue(this.editor.value)) {
        this.colorPopup.setValue(this.editor.value);
        this.positionEditor();
      }
      return;
    }
    if (config.type === 'date') {
      formatted = sanitizeDateEditorText(this.editor.value);
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      this.syncDateboxPanelToEditor();
      return;
    }
    if (config.type === 'combo') {
      if (this.editing) {
        this.editing.comboboxValue = null;
      }
      if (this.isComboboxPanelOpen()) {
        this.renderComboboxPanel(false);
        this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
        this.positionEditor();
      }
      return;
    }
    if (config.type === 'number') {
      formatted = formatNumberEditorText(sanitizeNumberEditorText(this.editor.value), shouldUseThousandsSeparator(column));
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      this.updateEditorSpinnerState();
    }
  };

  FabGrid.prototype.handleEditorCopy = function(event) {
    var edit = this.editing;
    var column;
    var start;
    var end;
    var next;
    var text;
    var clipboardData;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (column && getColumnEditorConfig(column).type === 'time') {
      start = this.editor.selectionStart;
      end = this.editor.selectionEnd;
      if (start == null || end == null || start === end) {
        return;
      }
      if (start > end) {
        next = start;
        start = end;
        end = next;
      }
      text = editorDefinitions.time && typeof editorDefinitions.time.getCopyText === 'function' ?
        editorDefinitions.time.getCopyText(
          this.editor.value.slice(start, end),
          mergeOptions(getColumnEditorConfig(column).options || {}, getMaskOptions(column, getEditorMask(column)))
        ) :
        this.editor.value.slice(start, end).replace(/[^0-9]/g, '');
      clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.setData) {
        return;
      }
      clipboardData.setData('text/plain', text);
      this.copyBuffer = text;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (column && getColumnEditorConfig(column).type === 'number') {
      start = this.editor.selectionStart;
      end = this.editor.selectionEnd;
      if (start == null || end == null || start === end) {
        return;
      }
      if (start > end) {
        next = start;
        start = end;
        end = next;
      }
      text = getNumberCopyText(this.editor.value.slice(start, end));
      clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.setData) {
        return;
      }
      clipboardData.setData('text/plain', text);
      this.copyBuffer = text;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!column || !getExplicitEditorMask(column)) {
      return;
    }
    start = this.editor.selectionStart;
    end = this.editor.selectionEnd;
    if (start == null || end == null || start === end) {
      return;
    }
    if (start > end) {
      next = start;
      start = end;
      end = next;
    }
    text = getMaskCopyText(this.editor.value.slice(start, end), getMaskOptions(column, getExplicitEditorMask(column)));
    clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.setData) {
      return;
    }
    clipboardData.setData('text/plain', text);
    this.copyBuffer = text;
    event.preventDefault();
    event.stopPropagation();
  };

  FabGrid.prototype.handleEditorTriggerClick = function(event) {
    var spinnerButton = closest(event.target, 'fg-editor-spinner-button');
    var button = closest(event.target, 'fg-editor-trigger');
    var iconConfig;
    var iconIndex;
    var handler;
    var result;
    if (!button && !spinnerButton) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!this.editing || !this.editorConfig) {
      return;
    }
    if (spinnerButton) {
      this.spinEditorValue(toNumber(spinnerButton.getAttribute('data-spin-direction'), 1));
      return;
    }
    iconIndex = button.hasAttribute('data-icon-index') ? toNumber(button.getAttribute('data-icon-index'), -1) : -1;
    if (iconIndex >= 0) {
      iconConfig = this.editorIconConfigs[iconIndex];
      handler = iconConfig && iconConfig.onClick;
      if (typeof handler === 'function') {
        result = handler.call(this, this.createEditorButtonArgs(event, button, iconConfig, iconIndex));
      }
      if (result !== false && (!iconConfig || iconConfig.keepFocus !== false)) {
        this.editor.focus();
      }
      return;
    }
    if (isDateLikeEditorType(this.editorConfig.type)) {
      if (this.isDateboxPanelOpen()) {
        this.hideDateboxPanel();
      } else {
        this.showDateboxPanel();
      }
      this.editor.focus();
      return;
    }
    if (this.editorConfig.type === 'combo') {
      if (this.isComboboxPanelOpen()) {
        this.hideComboboxPanel();
      } else {
        this.showComboboxPanel(true);
      }
      this.editor.focus();
      return;
    }
    if (this.editorConfig.type === 'color') {
      if (this.isColorPanelOpen()) {
        this.hideColorPanel();
      } else {
        this.showColorPanel();
      }
      this.editor.focus();
    }
  };

  FabGrid.prototype.createEditorButtonArgs = function(event, button, iconConfig, iconIndex) {
    var edit = this.editing || {};
    var column = this.visibleColumns[edit.col] || null;
    var item = this.view[edit.row] || null;
    return {
      grid: this,
      row: edit.row,
      col: edit.col,
      column: column,
      item: item,
      value: this.getEditorValue(),
      text: this.editor ? this.editor.value : '',
      original: edit.original,
      editor: this.editor,
      button: button || this.editorTrigger,
      icon: iconConfig || null,
      iconIndex: iconIndex == null ? -1 : iconIndex,
      icons: this.editorIconConfigs || [],
      event: event
    };
  };

  FabGrid.prototype.handleDocumentMouseDown = function(event) {
    var filterMenuItem;
    if (this.isTopLeftMenuOpen() && !closest(event.target, 'fg-top-left-menu')) {
      this.hideTopLeftMenu();
    }
    filterMenuItem = closest(event.target, 'fg-filter-menu-item') || this.getFilterMenuItemAtEvent(event);
    if (filterMenuItem) {
      this.handleFilterMenuClick(event);
    }
    if (this.filterMenu && this.filterMenu.style.display === 'block' &&
      !closest(event.target, 'fg-filter-menu') &&
      !closest(event.target, 'fg-filter-icon')) {
      this.hideFilterMenu();
    }
    if (this.isColumnChooserOpen() &&
      !closest(event.target, 'fg-column-chooser') &&
      !closest(event.target, 'fg-column-chooser-trigger')) {
      this.hideColumnChooser();
    }
    if (!this.editing) {
      return;
    }
  };

  FabGrid.prototype.handleDateboxKeyDown = function(event, input, column) {
    var config = column ? getColumnEditorConfig(column) : this.editorConfig;
    var isOpenForInput = this.isDateboxPanelOpen() &&
      this.dateboxTarget &&
      this.dateboxTarget.input === input;
    if (!input || !config || !isDateLikeEditorType(config.type)) {
      return false;
    }
    if ((event.key === 'ArrowDown' && (event.altKey || event.metaKey)) || event.key === 'F4') {
      event.preventDefault();
      if (column) {
        this.showHeaderSearchDateboxPanel(input, column);
      } else {
        this.showDateboxPanel();
      }
      return true;
    }
    return isOpenForInput ? this.datePopup.handleKeyDown(event) : false;
  };

  FabGrid.prototype.handleComboboxKeyDown = function(event) {
    if (!this.editorConfig || this.editorConfig.type !== 'combo') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showComboboxPanel(true);
      return true;
    }
    if (!this.isComboboxPanelOpen()) {
      return false;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex + 1);
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex - 1);
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectComboboxActiveOption();
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hideComboboxPanel();
      return true;
    }
    return false;
  };

  FabGrid.prototype.handleColorKeyDown = function(event) {
    if (!this.editorConfig || this.editorConfig.type !== 'color') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showColorPanel();
      return true;
    }
    if (event.key === 'Escape' && this.isColorPanelOpen()) {
      event.preventDefault();
      this.hideColorPanel();
      this.editor.focus();
      return true;
    }
    return false;
  };

  FabGrid.prototype.shouldEditOnSelect = function(row, col) {
    return this.options.editOnSelect === true && this.isCellEditable(row, col);
  };

  FabGrid.prototype.isCellEditable = function(row, col) {
    var column = this.visibleColumns[col];
    return this.options.allowEditing !== false &&
      row >= 0 &&
      row < this.view.length &&
      !this.isRowGroup(this.view[row]) &&
      !this.isRowGroupFooter(this.view[row]) &&
      !!column &&
      column.readOnly !== true;
  };

  FabGrid.prototype.commitEditingAndMoveRight = function() {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findNextEditableCell(edit.row, edit.col + 1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col);
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FabGrid.prototype.commitEditingAndMoveLeft = function() {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findPreviousEditableCell(edit.row, edit.col - 1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col);
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FabGrid.prototype.commitEditingAndMoveVertical = function(direction) {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findEditableCellInRow(edit.row + direction, edit.col, direction >= 0 ? 1 : -1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col, { directionY: direction });
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FabGrid.prototype.findNextEditableCell = function(row, col) {
    var r;
    var c;
    for (r = row; r < this.view.length; r += 1) {
      for (c = r === row ? col : 0; c < this.visibleColumns.length; c += 1) {
        if (this.isCellEditable(r, c)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  FabGrid.prototype.findPreviousEditableCell = function(row, col) {
    var r;
    var c;
    for (r = row; r >= 0; r -= 1) {
      for (c = r === row ? col : this.visibleColumns.length - 1; c >= 0; c -= 1) {
        if (this.isCellEditable(r, c)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  FabGrid.prototype.findEditableCellInRow = function(row, col, direction) {
    var c;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.isCellEditable(row, col)) {
      return { row: row, col: col };
    }
    direction = direction < 0 ? -1 : 1;
    for (c = col + direction; c >= 0 && c < this.visibleColumns.length; c += direction) {
      if (this.isCellEditable(row, c)) {
        return { row: row, col: c };
      }
    }
    for (c = col - direction; c >= 0 && c < this.visibleColumns.length; c -= direction) {
      if (this.isCellEditable(row, c)) {
        return { row: row, col: c };
      }
    }
    return null;
  };

  FabGrid.prototype.positionEditor = function() {
    var edit = this.editing;
    var column;
    var cell;
    var cellRect;
    var bodyRect;
    var left;
    var top;
    var width;
    var height;
    var isScrollableEditor;
    var editorBorderInset;
    var editorVerticalInset;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return;
    }
    cell = this.root.querySelector('.fg-cell[data-row="' + edit.row + '"][data-col="' + edit.col + '"]');
    if (cell) {
      cellRect = cell.getBoundingClientRect();
      bodyRect = this.body.getBoundingClientRect();
      left = cellRect.left - bodyRect.left;
      top = cellRect.top - bodyRect.top;
      width = cellRect.width;
      height = cellRect.height;
    } else if (edit.col < this.frozenColumns) {
      left = this.getFixedLeftWidth() + column._left;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    } else if (edit.col >= this.scrollableColumnEnd) {
      left = this.bodyScroll.clientWidth - this.frozenRightWidth + column._left - this.frozenRightStartLeft;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    } else {
      left = this.getFixedLeftWidth() + column._left - this.bodyScroll.scrollLeft;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    }
    this.editor.style.left = left + 'px';
    this.editor.style.top = top + 'px';
    this.editor.style.width = width + 'px';
    this.editor.style.height = height + 'px';
    isScrollableEditor = edit.col >= this.frozenColumns && edit.col < this.scrollableColumnEnd;
    this.editor.style.zIndex = isScrollableEditor ? '3' : '10';
    this.editorIconHost.style.zIndex = isScrollableEditor ? '3' : '11';
    if (this.editorConfig && (isDateLikeEditorType(this.editorConfig.type) || this.editorConfig.type === 'combo' || this.editorConfig.type === 'color' || this.editorSpinnerPosition || (this.editorIconConfigs && this.editorIconConfigs.length))) {
      editorBorderInset = Math.max(0, toNumber(this.options.activeCellBorder, 1));
      editorVerticalInset = editorBorderInset + 1;
      this.editorIconHost.style.left = this.editorSpinnerPosition === 'left' ?
        (left + editorBorderInset) + 'px' :
        (left + width - this.getEditorIconHostWidth() - editorBorderInset) + 'px';
      this.editorIconHost.style.top = (top + editorVerticalInset) + 'px';
      this.editorIconHost.style.height = Math.max(0, height - editorVerticalInset * 2) + 'px';
    }
    if (this.editorConfig && isDateLikeEditorType(this.editorConfig.type)) {
      this.positionDateboxPanel(left, top + height, width);
    }
    if (this.editorConfig && this.editorConfig.type === 'combo') {
      this.positionComboboxPanel(left, top + height, width);
    }
    if (this.editorConfig && this.editorConfig.type === 'color') {
      this.positionColorPanel(left, top + height);
    }
  };

  FabGrid.prototype.showDateboxPanel = function() {
    if (!this.editing || !this.editorConfig || !isDateLikeEditorType(this.editorConfig.type)) {
      return;
    }
    this.dateboxTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.hideComboboxPanel();
    this.hideColorPanel();
    this.syncDateboxPanelToEditor();
    this.datePopup.show();
    this.datePopup.position();
  };

  FabGrid.prototype.showHeaderSearchDateboxPanel = function(input, column) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || !isDateLikeEditorType(config.type)) {
      return;
    }
    this.dateboxTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideComboboxPanel();
    this.hideColorPanel();
    this.syncDateboxPanelToTarget(this.dateboxTarget);
    this.datePopup.show();
    this.datePopup.position();
    input.focus();
  };

  FabGrid.prototype.showComboboxPanel = function(showAll) {
    if (!this.editing || !this.editorConfig || this.editorConfig.type !== 'combo') {
      return;
    }
    this.comboboxTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.hideDateboxPanel();
    this.hideColorPanel();
    this.renderComboboxPanel(showAll === true);
    this.comboPopup.show();
    this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
    this.positionEditor();
  };

  FabGrid.prototype.showHeaderSearchComboboxPanel = function(input, column, showAll) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || config.type !== 'combo') {
      return;
    }
    this.comboboxTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideDateboxPanel();
    this.hideColorPanel();
    this.renderComboboxPanel(showAll === true);
    this.comboPopup.show();
    this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
    this.positionHeaderSearchComboboxPanel(input);
    input.focus();
  };

  FabGrid.prototype.hideDateboxPanel = function() {
    if (this.datePopup) this.datePopup.hide();
    this.dateboxTarget = null;
  };

  FabGrid.prototype.hideComboboxPanel = function() {
    if (this.comboPopup) this.comboPopup.hide();
    this.comboboxTarget = null;
    this.comboboxActiveIndex = -1;
  };

  FabGrid.prototype.getEditorIconHostWidth = function() {
    if (!this.editorIconHost || this.editorIconHost.style.display === 'none') {
      return 0;
    }
    return Math.max(18, Math.ceil(this.editorIconHostWidth || this.editorIconHost.offsetWidth || 0));
  };

  FabGrid.prototype.isDateboxPanelOpen = function() {
    return !!this.datePopup && this.datePopup.isOpen();
  };

  FabGrid.prototype.positionHeaderSearchDateboxPanel = function(input) {
    if (!input || !this.datePopup) return;
    this.datePopup.setOptions({
      anchor: input,
      panelWidth: Math.max(250, input.getBoundingClientRect().width)
    });
    this.datePopup.position();
  };

  FabGrid.prototype.positionHeaderSearchComboboxPanel = function(input) {
    if (!input || !this.comboPopup) return;
    this.comboPopup.setLayout({ anchor: input });
    this.comboPopup.position();
  };

  FabGrid.prototype.positionHeaderSearchColorPanel = function(input) {
    if (!input || !this.colorPopup) return;
    this.colorPopup.setOptions({ anchor: input });
    this.colorPopup.position();
  };

  FabGrid.prototype.isComboboxPanelOpen = function() {
    return !!this.comboPopup && this.comboPopup.isOpen();
  };

  FabGrid.prototype.getColorTarget = function() {
    if (this.colorTarget) {
      return this.colorTarget;
    }
    if (!this.editing || !this.editorConfig || this.editorConfig.type !== 'color') {
      return null;
    }
    return {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
  };

  FabGrid.prototype.getColorPanelConfig = function() {
    var target = this.getColorTarget();
    return target && target.config ? target.config : this.editorConfig;
  };

  FabGrid.prototype.showColorPanel = function() {
    if (!this.editing || !this.editorConfig || this.editorConfig.type !== 'color') {
      return;
    }
    this.colorTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.hideDateboxPanel();
    this.hideComboboxPanel();
    this.renderColorPanel();
    this.colorPopup.show();
    this.positionEditor();
  };

  FabGrid.prototype.showHeaderSearchColorPanel = function(input, column) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || config.type !== 'color') {
      return;
    }
    this.colorTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideDateboxPanel();
    this.hideComboboxPanel();
    this.renderColorPanel();
    this.colorPopup.show();
    this.positionHeaderSearchColorPanel(input);
    input.focus();
  };

  FabGrid.prototype.hideColorPanel = function() {
    if (this.colorPopup) this.colorPopup.hide();
    this.colorTarget = null;
  };

  FabGrid.prototype.isColorPanelOpen = function() {
    return !!this.colorPopup && this.colorPopup.isOpen();
  };

  FabGrid.prototype.renderColorPanel = function() {
    var target = this.getColorTarget();
    var config = this.getColorPanelConfig();
    var input = target && target.input;
    if (!this.colorPopup || !input) return;
    this.colorPopup.setOptions({
      anchor: input,
      ariaLabel: this.getText('aria.colorPicker'),
      saturationText: this.getText('aria.colorSaturation'),
      hueText: this.getText('aria.colorHue'),
      alphaText: this.getText('aria.colorAlpha'),
      palette: getColorPalette(config),
      showAlpha: getColorShowAlpha(config),
      closeOnDragEnd: target.type === 'search'
    });
    this.colorPopup.setValue(input.value || '#ff0000');
  };

  FabGrid.prototype.applyColorValueToTarget = function(value) {
    var target = this.getColorTarget();
    if (!target || !target.input) {
      return;
    }
    target.input.value = value;
    if (target.type === 'search') {
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      this.syncColorEditorAppearance();
    }
  };

  FabGrid.prototype.syncColorEditorAppearance = function() {
    var color = this.editor ? normalizeColorValue(this.editor.value) : '';
    if (this.editor) {
      this.editor.style.setProperty('--fg-editor-color', color || 'transparent');
    }
  };

  FabGrid.prototype.renderComboboxPanel = function(showAll) {
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    var items = getComboboxData(config);
    var query = showAll === true || !target || !target.input ? '' : String(target.input.value || '').toLowerCase();
    var descriptors = [];
    var options = config && config.options ? config.options : {};
    var showValue = options.showValueInList === true ||
      options.showValue === true ||
      options.showCode === true;
    var item;
    var text;
    var value;
    var selectedText = target && target.input ?
      String(target.input.value || '') :
      '';
    var i;
    this.comboboxItems = [];
    this.comboboxActiveIndex = -1;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      text = getComboboxItemText(item, config);
      value = String(getComboboxItemValue(item, config));
      if (query && text.toLowerCase().indexOf(query) < 0 && value.toLowerCase().indexOf(query) < 0) {
        continue;
      }
      descriptors.push({
        value: value,
        text: text,
        secondaryText: showValue && value !== '' && value !== text ?
          '(' + value + ')' :
          '',
        data: item,
        disabled: Boolean(item && typeof item === 'object' && item.disabled),
        selected: selectedText === text || selectedText === value
      });
      this.comboboxItems.push(item);
    }
    this.comboPopup.setOptions({
      anchor: target && target.input ? target.input : this.editor,
      className: 'fui-grid-combo-popup',
      ariaLabel: this.getText('aria.comboBoxOptions'),
      panelWidth: target && target.input ?
        target.input.getBoundingClientRect().width :
        120,
      panelHeight: 'auto',
      panelMinWidth: 120,
      panelMaxWidth: Math.max(120, this.root.clientWidth - 4),
      panelMaxHeight: 180,
      fitContent: true,
      closeOnSelect: true,
      emptyText: this.getText('combobox.emptyText'),
      items: descriptors
    });
  };

  FabGrid.prototype.getComboboxInitialActiveIndex = function() {
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    var text = target && target.input ? String(target.input.value || '') : '';
    var i;
    for (i = 0; i < this.comboboxItems.length; i += 1) {
      if (getComboboxItemText(this.comboboxItems[i], config) === text ||
        String(getComboboxItemValue(this.comboboxItems[i], config)) === text) {
        return i;
      }
    }
    return this.comboboxItems.length ? 0 : -1;
  };

  FabGrid.prototype.setComboboxActiveIndex = function(index) {
    if (!this.comboboxItems.length) {
      this.comboboxActiveIndex = -1;
      return;
    }
    index = clamp(index, 0, this.comboboxItems.length - 1);
    this.comboPopup.setActiveIndex(index);
    this.comboboxActiveIndex = this.comboPopup.activeIndex;
  };

  FabGrid.prototype.selectComboboxActiveOption = function() {
    if (this.comboboxActiveIndex < 0) {
      return;
    }
    this.selectComboboxOption(this.comboboxActiveIndex);
  };

  FabGrid.prototype.selectComboboxOption = function(index) {
    var item = this.comboboxItems[index];
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    if (item == null) {
      return;
    }
    if (target.type === 'editor' && this.editing) {
      this.editing.comboboxValue = getComboboxItemValue(item, config);
      target.input.value = getComboboxItemText(item, config);
    } else if (target.input) {
      target.input.value = getComboboxItemText(item, config);
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    this.hideComboboxPanel();
    if (target.input) {
      target.input.focus();
    }
  };

  FabGrid.prototype.syncDateboxPanelToEditor = function() {
    this.syncDateboxPanelToTarget(this.dateboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    });
  };

  FabGrid.prototype.syncDateboxPanelToTarget = function(target) {
    var date;
    var dateOptions = target && target.config && target.config.options ?
      target.config.options :
      {};
    if (!target || !target.input || !target.config) {
      date = null;
    } else {
      date = parseDateboxEditorValue(target.input.value, target.config, target.column);
    }
    if (!date && target && target.type === 'editor' && this.editing) {
      date = isYearMonthDateboxTarget(target) ?
        parseYearMonthValue(this.editing.yearMonthValue || this.editing.original) :
        parseDateValue(this.editing.dateboxValue || this.editing.original);
    }
    if (!date) {
      date = new Date();
    }
    this.datePopup.setOptions({
      anchor: target && target.input ? target.input : this.editor,
      className: 'fui-grid-date-popup',
      theme: 'inherit',
      themeSource: this.root,
      panelWidth: Math.max(
        250,
        target && target.input ? target.input.getBoundingClientRect().width : 0
      ),
      panelHeight: 'auto',
      ariaLabel: this.getText('aria.datePicker'),
      firstDay: 0,
      showWeek: false,
      showLunar: dateOptions.showLunar === true ||
        Boolean(target && target.column && target.column.showLunar === true),
      locale: this.locale,
      currentText: this.getText('datebox.today'),
      currentMonthText: this.getText('datebox.currentMonth'),
      closeText: this.getText('datebox.close'),
      yearText: this.getText('aria.year'),
      weeks: this.getText('datebox.weekdays'),
      months: this.getText('datebox.months'),
      buttons: isYearMonthDateboxTarget(target) ? [] : null,
      calendarMode: isYearMonthDateboxTarget(target) ? 'months' : 'days',
      validator: function() { return true; },
      validatorContext: this,
      owner: this
    });
    this.datePopup.setValue(date, date);
  };

  FabGrid.prototype.applyDateboxTargetDate = function(date) {
    var target = this.dateboxTarget;
    var text;
    if (!target || !target.input || !target.config) {
      return;
    }
    if (target.type === 'editor' && this.editing) {
      if (isYearMonthDateboxTarget(target)) {
        this.editing.yearMonthValue = formatYearMonthDataText(date, target.column);
        target.input.value = formatYearMonthEditorText(date, target.config, target.column);
      } else {
        this.editing.dateboxValue = formatDateIso(date);
        target.input.value = formatDateboxEditorText(date, target.config, target.column);
      }
    } else {
      text = isYearMonthDateboxTarget(target) ?
        formatYearMonthEditorText(date, target.config, target.column) :
        formatDateboxEditorText(date, target.config, target.column);
      target.input.value = text;
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    this.hideDateboxPanel();
    target.input.focus();
  };

  FabGrid.prototype.renderDateboxPanel = function() {
    if (!this.datePopup) return;
    if (this.dateboxTarget) {
      this.syncDateboxPanelToTarget(this.dateboxTarget);
    } else {
      this.datePopup.render();
    }
  };

  FabGrid.prototype.positionDateboxPanel = function(left, top, width) {
    if (!this.datePopup) return;
    this.datePopup.setOptions({
      anchor: this.dateboxTarget && this.dateboxTarget.input ?
        this.dateboxTarget.input :
        this.editor,
      panelWidth: Math.max(250, width)
    });
    this.datePopup.position();
  };

  FabGrid.prototype.positionComboboxPanel = function(left, top, width) {
    var maxWidth = Math.max(120, this.root.clientWidth - 4);
    if (!this.comboPopup) return;
    this.comboPopup.setLayout({
      anchor: this.comboboxTarget && this.comboboxTarget.input ?
        this.comboboxTarget.input :
        this.editor,
      panelWidth: Math.max(120, width),
      panelMaxWidth: maxWidth,
      fitContent: true
    });
    this.comboPopup.position();
  };

  FabGrid.prototype.positionColorPanel = function(left, top) {
    var panelWidth = Math.min(420, Math.max(260, this.root.clientWidth - 4));
    if (!this.colorPopup) return;
    this.colorPopup.setOptions({
      anchor: this.colorTarget && this.colorTarget.input ?
        this.colorTarget.input :
        this.editor,
      panelWidth: panelWidth
    });
    this.colorPopup.position();
  };

  FabGrid.prototype.measureComboboxPanelWidth = function() {
    return this.comboPopup ? this.comboPopup.measureContentWidth() : 0;
  };

  FabGrid.prototype.clearEditingState = function() {
    this.editing = null;
    this.editorConfig = null;
    this.editorIconConfigs = [];
    this.editorSpinnerPosition = false;
    this.editorIconHostWidth = 0;
    this.comboboxItems = [];
    if (this.editor) {
      this.editor.style.display = 'none';
    }
    if (this.editorIconHost) {
      this.editorIconHost.style.display = 'none';
    }
    this.hideInvalidTip();
    this.hideDateboxPanel();
    this.hideComboboxPanel();
    this.hideColorPanel();
  };

  FabGrid.prototype.syncEditingWithView = function() {
    var edit = this.editing;
    if (!edit) {
      return;
    }
    if (edit.row < 0 || edit.row >= this.view.length || (edit.item && this.view[edit.row] !== edit.item)) {
      this.clearEditingState();
    }
  };

  FabGrid.prototype.finishEditing = function(commit) {
    var edit = this.editing;
    var column;
    var item;
    var value;
    var validationValue;
    var validationError;
    var args;
    if (!edit) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    item = this.view[edit.row];
    if (commit && item && column) {
      if (!isSafeBinding(column.binding)) {
        return false;
      }
      value = this.getEditorValue(column);
      if (column.dataType === 'number') {
        value = roundNumberValue(parseValue(value, column.dataType), column);
        validationValue = value;
      } else {
        validationValue = value;
        value = parseValue(value, column.dataType);
      }
      validationError = this.validateCellValue(item, column, validationValue, edit.row, edit.col);
      args = {
        row: edit.row,
        col: edit.col,
        column: column,
        item: item,
        value: value,
        previousValue: edit.original,
        validationError: validationError
      };
      if (this.emit('cellEditEnding', args) === false) {
        return false;
      }
      this._suppressObservedItemChange += 1;
      try {
        setByBinding(item, column.binding, args.value);
      } finally {
        this._suppressObservedItemChange -= 1;
      }
      if (isPromiseLike(args.validationError)) {
        this.setPendingCellValidation(item, column, args.validationError, args.value, edit.row, edit.col);
      } else if (args.validationError) {
        this.setCellValidationError(item, column, args.validationError, edit.row, edit.col);
      } else {
        this.clearCellValidationError(item, column);
      }
      this.emit('cellEditEnded', args);
    }
    this.clearEditingState();
    this.applyView();
    this.render();
    this.root.focus();
    return true;
  };

  FabGrid.prototype.validateCellValue = function(item, column, value, rowIndex, colIndex) {
    var self = this;
    var config = getColumnEditorConfig(column);
    var args;
    var result;
    if (!item || !column) {
      return null;
    }
    if (typeof column.validate === 'function') {
      args = {
        grid: this,
        item: item,
        column: column,
        value: value,
        binding: column.binding,
        rowIndex: rowIndex,
        rowNumber: rowIndex >= 0 ? rowIndex + 1 : null,
        colIndex: colIndex,
        colNumber: colIndex >= 0 ? colIndex + 1 : null
      };
      result = column.validate(args);
      if (isPromiseLike(result)) {
        return result.then(function(nextResult) {
          return normalizeValidationResult(nextResult, value, 'custom', self.getText('validation.invalidValue')) || getDefaultValidationErrorForGrid(self, config, value, column);
        });
      }
      result = normalizeValidationResult(result, value, 'custom', this.getText('validation.invalidValue'));
      if (result) {
        return result;
      }
    }
    return getDefaultValidationErrorForGrid(this, config, value, column);
  };

  FabGrid.prototype.validateRow = function(row) {
    var self = this;
    var item;
    var rowIndex;
    var validations = [];
    var column;
    var value;
    var colIndex;
    var validationResult;
    var i;
    row = Math.floor(toNumber(row, -1));
    if (row < 0 || row >= this.source.length) {
      return Promise.resolve(false);
    }
    this.applyView();
    item = this.source[row];
    if (!item || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return Promise.resolve(false);
    }
    rowIndex = this.view.indexOf(item);
    for (i = 0; i < this.columns.length; i += 1) {
      column = this.columns[i];
      value = getByBinding(item, column.binding);
      colIndex = this.visibleColumns.indexOf(column);
      try {
        validationResult = this.validateCellValue(item, column, value, rowIndex, colIndex);
      } catch (error) {
        return Promise.reject(error);
      }
      (function(targetColumn, targetValue, targetColIndex, result) {
        validations.push(Promise.resolve(result).then(function(error) {
          return {
            column: targetColumn,
            value: targetValue,
            colIndex: targetColIndex,
            error: error
          };
        }));
      }(column, value, colIndex, validationResult));
    }
    return Promise.all(validations).then(function(results) {
      var valid = true;
      var result;
      var j;
      for (j = 0; j < results.length; j += 1) {
        result = results[j];
        if (result.error) {
          valid = false;
          self.setCellValidationError(item, result.column, result.error, rowIndex, result.colIndex);
        } else {
          self.clearCellValidationError(item, result.column);
        }
      }
      if (!self.disposed) {
        self.render();
      }
      return valid;
    });
  };

  FabGrid.prototype.setPendingCellValidation = function(item, column, promise, value, rowIndex, colIndex) {
    var self = this;
    var key = this.getValidationErrorKey(item, column);
    var seq;
    if (!key) {
      return;
    }
    this._asyncValidationSeq += 1;
    seq = this._asyncValidationSeq;
    this._asyncValidationMap[key] = seq;
    promise.then(function(result) {
      if (self.disposed || self._asyncValidationMap[key] !== seq) {
        return;
      }
      if (result) {
        self.setCellValidationError(item, column, result, rowIndex, colIndex);
      } else {
        self.clearCellValidationError(item, column);
      }
      self.applyView();
      self.render();
    }).catch(function(error) {
      if (self.disposed || self._asyncValidationMap[key] !== seq) {
        return;
      }
      self.setCellValidationError(item, column, {
        type: 'async',
        message: error && error.message ? error.message : self.getText('validation.invalidValue'),
        value: value
      }, rowIndex, colIndex);
      self.applyView();
      self.render();
    });
  };

  function getDefaultValidationErrorForGrid(grid, config, value, column) {
    var options = config && config.options ? config.options : {};
    var text;
    var validDate;
    var message;
    var isYearMonth;
    if (!config) {
      return null;
    }
    if (config.type === 'combo' && options.limitToList === true) {
      text = value == null ? '' : String(value).trim();
      if (text === '' || isComboboxValueInList(value, config)) {
        return null;
      }
      message = grid ? grid.getText('validation.comboboxLimitToList') : 'Please select a valid item';
      return {
        type: 'combo',
        message: options.limitToListMessage || message,
        value: value
      };
    }
    if (config.type === 'color') {
      text = value == null ? '' : String(value).trim();
      if (text === '' || isColorValueValid(text)) {
        return null;
      }
      return {
        type: 'color',
        message: grid ? grid.getText('validation.invalidColor') : 'Invalid color',
        value: value
      };
    }
    if (config.type === 'time') {
      text = value == null ? '' : String(value).trim();
      if (text === '' || (editorDefinitions.time && typeof editorDefinitions.time.isValid === 'function' &&
        editorDefinitions.time.isValid(text, mergeOptions(options, { mask: getEditorMask(column) })))) {
        return null;
      }
      return {
        type: 'time',
        message: options.invalidTimeText || (grid ? grid.getText('validation.invalidTime') : 'Invalid time'),
        value: value
      };
    }
    isYearMonth = isYearMonthDateboxConfig(config, column);
    if (config.type !== 'date') {
      return null;
    }
    text = value == null ? '' : String(value).trim();
    if (text === '') {
      return null;
    }
    validDate = isYearMonth ? parseYearMonthValue(text) : parseDateValue(text);
    if (validDate) {
      return null;
    }
    return {
      type: isYearMonth ? 'yearMonth' : 'date',
      message: grid ?
        grid.getText(isYearMonth ? 'validation.invalidYearMonth' : 'validation.invalidDate') :
        (isYearMonth ? 'Invalid year and month' : 'Invalid date'),
      value: value
    };
  }

  FabGrid.prototype.getValidationErrorKey = function(item, column) {
    var id;
    var nextId;
    if (!item || !column) {
      return '';
    }
    if (!item.__fgValidationId) {
      this._validationErrorSeq += 1;
      nextId = 'r' + this._validationErrorSeq;
      try {
        Object.defineProperty(item, '__fgValidationId', {
          value: nextId,
          enumerable: false
        });
      } catch (error) {
        try {
          item.__fgValidationId = nextId;
        } catch (assignError) {
          return this.getFallbackValidationId(item) + '::' + (column.binding || column.header || column._index);
        }
      }
    }
    id = item.__fgValidationId;
    return id + '::' + (column.binding || column.header || column._index);
  };

  FabGrid.prototype.getFallbackValidationId = function(item) {
    var i;
    for (i = 0; i < this._validationItems.length; i += 1) {
      if (this._validationItems[i] === item) {
        return this._validationItemIds[i];
      }
    }
    this._validationErrorSeq += 1;
    this._validationItems.push(item);
    this._validationItemIds.push('r' + this._validationErrorSeq);
    return this._validationItemIds[this._validationItemIds.length - 1];
  };

  FabGrid.prototype.setCellValidationError = function(item, column, error, rowIndex, colIndex) {
    var key = this.getValidationErrorKey(item, column);
    var existingIndex;
    var next;
    if (!key) {
      return;
    }
    delete this._asyncValidationMap[key];
    rowIndex = toNumber(rowIndex, -1);
    colIndex = toNumber(colIndex, column ? column._viewIndex : -1);
    next = mergeOptions({
      key: key,
      item: item,
      column: column,
      binding: column.binding,
      rowIndex: rowIndex,
      rowNumber: rowIndex >= 0 ? rowIndex + 1 : null,
      colIndex: colIndex,
      colNumber: colIndex >= 0 ? colIndex + 1 : null,
      message: this.getText('validation.invalidValue'),
      value: null
    }, error || {});
    if (Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      existingIndex = this._invalidItemMap[key];
      this.invalidItems[existingIndex] = next;
      return;
    }
    this._invalidItemMap[key] = this.invalidItems.length;
    this.invalidItems.push(next);
  };

  FabGrid.prototype.clearCellValidationError = function(item, column) {
    var key = this.getValidationErrorKey(item, column);
    var index;
    var last;
    if (key) {
      delete this._asyncValidationMap[key];
    }
    if (key && Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      index = this._invalidItemMap[key];
      last = this.invalidItems.pop();
      delete this._invalidItemMap[key];
      if (last && index < this.invalidItems.length) {
        this.invalidItems[index] = last;
        this._invalidItemMap[last.key] = index;
      }
    }
  };

  FabGrid.prototype.getCellValidationError = function(item, column) {
    var key = this.getValidationErrorKey(item, column);
    if (!key || !Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      return null;
    }
    return this.invalidItems[this._invalidItemMap[key]] || null;
  };

  FabGrid.prototype.refreshInvalidItemRows = function() {
    var rowLookup = {};
    var i;
    var item;
    var id;
    var rowIndex;
    var entry;
    if (!this.invalidItems.length) {
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      id = this.getExistingValidationId(item);
      if (id) {
        rowLookup[id] = i;
      }
    }
    for (i = 0; i < this.invalidItems.length; i += 1) {
      entry = this.invalidItems[i];
      rowIndex = Object.prototype.hasOwnProperty.call(rowLookup, getValidationRowId(entry.key)) ?
        rowLookup[getValidationRowId(entry.key)] :
        -1;
      entry.rowIndex = rowIndex;
      entry.rowNumber = rowIndex >= 0 ? rowIndex + 1 : null;
    }
  };

  FabGrid.prototype.getExistingValidationId = function(item) {
    var i;
    if (!item) {
      return '';
    }
    if (item.__fgValidationId) {
      return item.__fgValidationId;
    }
    for (i = 0; i < this._validationItems.length; i += 1) {
      if (this._validationItems[i] === item) {
        return this._validationItemIds[i];
      }
    }
    return '';
  };

  FabGrid.prototype.getEditorValue = function(column) {
    var config;
    var mask;
    if (!column && this.editing) {
      column = this.visibleColumns[this.editing.col];
    }
    config = getColumnEditorConfig(column);
    mask = getExplicitEditorMask(column);
    if (config.type === 'time' && editorDefinitions.time && typeof editorDefinitions.time.getDataValue === 'function') {
      return editorDefinitions.time.getDataValue(
        this.editor.value,
        mergeOptions(config.options || {}, getMaskOptions(column, getEditorMask(column)))
      );
    }
    if (mask) {
      return getMaskDataValue(this.editor.value, getMaskOptions(column, mask));
    }
    if (config.type === 'date') {
      return getDateboxDataValue(this.editor.value, config, this.editing);
    }
    if (config.type === 'combo') {
      return getComboboxDataValue(this.editor.value, config, this.editing);
    }
    if (config.type === 'color') {
      return parseColorValue(this.editor.value);
    }
    return this.editor.value;
  };
}
