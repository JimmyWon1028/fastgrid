export function installFabGridEditorRuntime(FabGrid, context) {
  var applyMask = context.applyMask;
  var clamp = context.clamp;
  var closest = context.closest;
  var colorStateToHex = context.colorStateToHex;
  var countMaskCharactersBeforeCaret = context.countMaskCharactersBeforeCaret;
  var createColorState = context.createColorState;
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
  var hsvToRgb = context.hsvToRgb;
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
  var renderComboboxOptionContent = context.renderComboboxOptionContent;
  var roundNumberValue = context.roundNumberValue;
  var sanitizeDateEditorText = context.sanitizeDateEditorText;
  var sanitizeNumberEditorText = context.sanitizeNumberEditorText;
  var setByBinding = context.setByBinding;
  var shouldUseThousandsSeparator = context.shouldUseThousandsSeparator;
  var toNumber = context.toNumber;
  var trimText = context.trimText;

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
    var hasEditorIcons = hasBuiltInEditorIcon || iconConfigs.length > 0;
    this.editorConfig = config;
    this.editorIconConfigs = iconConfigs;
    this.renderEditorIcons(type, iconConfigs);
    this.editor.className = 'fg-editor ' + editorClassName + (hasEditorIcons ? ' fg-editor-with-icons' : '');
    this.editor.setAttribute('data-editor-type', type);
    this.editor.setAttribute('autocomplete', 'off');
    this.editor.type = 'text';
    this.editor.inputMode = definition && definition.inputMode ? definition.inputMode : (isDateLikeEditorType(type) ? 'numeric' : 'text');
    this.editor.style.paddingRight = hasEditorIcons ? (getEditorIconConfigWidth(iconConfigs, type) + 6) + 'px' : '';
    this.editorIconHost.style.display = hasEditorIcons ? 'flex' : 'none';
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

  FabGrid.prototype.renderEditorIcons = function(type, iconConfigs) {
    var fragment = document.createDocumentFragment();
    var button;
    var icon;
    var i;
    this.editorIconHost.innerHTML = '';
    if (iconConfigs && iconConfigs.length) {
      for (i = 0; i < iconConfigs.length; i += 1) {
        icon = iconConfigs[i];
        button = document.createElement('button');
        button.type = 'button';
        button.className = trimText('fg-editor-trigger fg-editor-trigger-custom ' + normalizeClassName(icon.iconCls || icon.className || icon.iconClass || icon.icon || ''));
        button.setAttribute('data-icon-index', i);
        button.setAttribute('aria-label', icon.ariaLabel || icon.label || icon.title || this.getText('aria.cellEditor'));
        button.title = icon.title || '';
        button.textContent = icon.text || '';
        button.style.width = Math.max(18, toNumber(icon.width, 22)) + 'px';
        fragment.appendChild(button);
      }
    } else {
      button = document.createElement('button');
      button.type = 'button';
      button.className = trimText('fg-editor-trigger fg-editor-trigger-' + type + (isDateLikeEditorType(type) ? ' icon-datebox' : ''));
      button.setAttribute('aria-label', this.getEditorTriggerLabel());
      button.style.width = '22px';
      fragment.appendChild(button);
    }
    this.editorIconHost.appendChild(fragment);
    this.editorTrigger = this.editorIconHost.querySelector('.fg-editor-trigger');
  };

  FabGrid.prototype.getEditorText = function(value, column) {
    var config = getColumnEditorConfig(column);
    var mask = getExplicitEditorMask(column);
    if (value == null) {
      return '';
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
    if (isDateLikeEditorType(config.type)) {
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
    if (isDateLikeEditorType(getColumnEditorConfig(column).type) && dateDefinition && typeof dateDefinition.handleDelete === 'function') {
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
    if (isDateLikeEditorType(config.type) && /[^0-9]/.test(text)) {
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
      formatted = formatMaskText(this.editor.value, { mask: mask });
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      if (config && isDateLikeEditorType(config.type)) {
        this.syncDateboxPanelToEditor();
      }
      return;
    }
    if (!column || !config) {
      return;
    }
    if (config.type === 'color') {
      this.syncColorEditorAppearance();
      if (this.isColorPanelOpen() && normalizeColorValue(this.editor.value)) {
        this.colorState = createColorState(this.editor.value);
        this.renderColorPanel();
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
    var button = closest(event.target, 'fg-editor-trigger');
    var iconConfig;
    var iconIndex;
    var handler;
    var result;
    if (!button) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!this.editing || !this.editorConfig) {
      return;
    }
    iconIndex = button.hasAttribute('data-icon-index') ? toNumber(button.getAttribute('data-icon-index'), -1) : -1;
    if (iconIndex >= 0) {
      iconConfig = this.editorIconConfigs[iconIndex];
      handler = iconConfig && (iconConfig.onClick || iconConfig.click || iconConfig.handler);
      if (typeof handler === 'function') {
        result = handler.call(this, this.createEditorButtonArgs(event, button, iconConfig, iconIndex));
      }
      if (result !== false && (!iconConfig || iconConfig.keepFocus !== false)) {
        this.editor.focus();
      }
      return;
    }
    if (isDateLikeEditorType(this.editorConfig.type)) {
      if (this.dateboxPanel.style.display === 'block') {
        this.hideDateboxPanel();
      } else {
        this.showDateboxPanel();
      }
      this.editor.focus();
      return;
    }
    if (this.editorConfig.type === 'combo') {
      if (this.comboboxPanel.style.display === 'block') {
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

  FabGrid.prototype.handleDateboxClick = function(event) {
    var day = closest(event.target, 'fg-datebox-day');
    var monthButton = closest(event.target, 'fg-datebox-month');
    var control = closest(event.target, 'fg-datebox-control');
    var target = this.dateboxTarget;
    var action;
    var date;
    var month;
    if (!target || !target.input || !target.config || !isDateLikeEditorType(target.config.type)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (monthButton) {
      month = toNumber(monthButton.getAttribute('data-month'), this.dateboxState ? this.dateboxState.month : 0);
      if (isYearMonthDateboxTarget(target)) {
        this.applyDateboxTargetDate(new Date(this.dateboxState ? this.dateboxState.year : new Date().getFullYear(), clamp(month, 0, 11), 1));
        return;
      }
      this.dateboxState = {
        year: this.dateboxState ? this.dateboxState.year : new Date().getFullYear(),
        month: clamp(month, 0, 11),
        selected: this.dateboxState ? this.dateboxState.selected : null,
        mode: 'calendar'
      };
      this.renderDateboxPanel();
      return;
    }
    if (day && !hasClass(day, 'fg-datebox-disabled')) {
      date = parseDateValue(day.getAttribute('data-date'));
      if (date) {
        this.applyDateboxTargetDate(date);
      }
      return;
    }
    if (!control) {
      return;
    }
    action = control.getAttribute('data-action');
    if (action === 'months') {
      this.dateboxState.mode = 'months';
      this.renderDateboxPanel();
      return;
    }
    if (action === 'close') {
      this.hideDateboxPanel();
      target.input.focus();
      return;
    }
    if (action === 'today') {
      date = new Date();
      this.dateboxState = {
        year: date.getFullYear(),
        month: date.getMonth(),
        selected: date,
        mode: 'calendar'
      };
      this.renderDateboxPanel();
      this.applyDateboxTargetDate(date);
      return;
    }
    this.moveDateboxMonth(action);
  };

  FabGrid.prototype.handleDateboxChange = function(event) {
    var input = closest(event.target, 'fg-datebox-year-input');
    var target = this.dateboxTarget;
    var year;
    if (!input || !target || !target.config || !isDateLikeEditorType(target.config.type)) {
      return;
    }
    year = clamp(toNumber(input.value, this.dateboxState ? this.dateboxState.year : new Date().getFullYear()), 1, 9999);
    this.dateboxState = this.dateboxState || {
      year: year,
      month: new Date().getMonth(),
      selected: null,
      mode: 'months'
    };
    this.dateboxState.year = year;
    this.dateboxState.mode = 'months';
    this.renderDateboxPanel();
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
    if (this.dateboxPanel && this.dateboxPanel.style.display === 'block' &&
      !(
        (this.dateboxTarget && event.target === this.dateboxTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-datebox-panel')
      )) {
      this.hideDateboxPanel();
    }
    if (this.comboboxPanel && this.comboboxPanel.style.display === 'block' &&
      !(
        (this.comboboxTarget && event.target === this.comboboxTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-combobox-panel')
      )) {
      this.hideComboboxPanel();
    }
    if (this.isColorPanelOpen() &&
      !(
        (this.colorTarget && event.target === this.colorTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-color-panel')
      )) {
      this.hideColorPanel();
    }
    if (!this.editing) {
      return;
    }
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
    if (this.editorConfig && (isDateLikeEditorType(this.editorConfig.type) || this.editorConfig.type === 'combo' || this.editorConfig.type === 'color' || (this.editorIconConfigs && this.editorIconConfigs.length))) {
      this.editorIconHost.style.left = (left + width - this.getEditorIconHostWidth() - 2) + 'px';
      this.editorIconHost.style.top = top + 'px';
      this.editorIconHost.style.height = height + 'px';
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
    this.hideColorPanel();
    this.syncDateboxPanelToEditor();
    this.renderDateboxPanel();
    this.dateboxPanel.style.display = 'block';
    this.positionEditor();
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
    this.renderDateboxPanel();
    this.dateboxPanel.style.display = 'block';
    this.positionHeaderSearchDateboxPanel(input);
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
    this.comboboxPanel.style.display = 'block';
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
    this.comboboxPanel.style.display = 'block';
    this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
    this.positionHeaderSearchComboboxPanel(input);
    input.focus();
  };

  FabGrid.prototype.hideDateboxPanel = function() {
    if (this.dateboxPanel) {
      this.dateboxPanel.style.display = 'none';
    }
    this.dateboxTarget = null;
  };

  FabGrid.prototype.hideComboboxPanel = function() {
    if (this.comboboxPanel) {
      this.comboboxPanel.style.display = 'none';
    }
    this.comboboxTarget = null;
    this.comboboxActiveIndex = -1;
  };

  FabGrid.prototype.getEditorIconHostWidth = function() {
    if (!this.editorIconHost || this.editorIconHost.style.display === 'none') {
      return 0;
    }
    return Math.max(18, Math.ceil(this.editorIconHost.offsetWidth || 0));
  };

  FabGrid.prototype.isDateboxPanelOpen = function() {
    return !!this.dateboxPanel && this.dateboxPanel.style.display === 'block';
  };

  FabGrid.prototype.positionHeaderSearchDateboxPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionDateboxPanel(left, top, inputRect.width);
  };

  FabGrid.prototype.positionHeaderSearchComboboxPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionComboboxPanel(left, top, inputRect.width);
  };

  FabGrid.prototype.positionHeaderSearchColorPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionColorPanel(left, top);
  };

  FabGrid.prototype.isComboboxPanelOpen = function() {
    return !!this.comboboxPanel && this.comboboxPanel.style.display === 'block';
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
    this.colorState = createColorState(this.editor.value || this.editing.original);
    this.renderColorPanel();
    this.colorPanel.style.display = 'flex';
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
    this.colorState = createColorState(input.value || '#ff0000');
    this.renderColorPanel();
    this.colorPanel.style.display = 'flex';
    this.positionHeaderSearchColorPanel(input);
    input.focus();
  };

  FabGrid.prototype.hideColorPanel = function() {
    if (this.colorPanel) {
      this.colorPanel.style.display = 'none';
    }
    this.colorDragState = null;
    this.colorTarget = null;
  };

  FabGrid.prototype.isColorPanelOpen = function() {
    return !!this.colorPanel && this.colorPanel.style.display === 'flex';
  };

  FabGrid.prototype.renderColorPanel = function() {
    var config = this.getColorPanelConfig();
    var palette = getColorPalette(config);
    var paletteElement = document.createElement('div');
    var controls = document.createElement('div');
    var sv = document.createElement('div');
    var svMarker = document.createElement('span');
    var hue = document.createElement('div');
    var hueMarker = document.createElement('span');
    var alpha = document.createElement('div');
    var alphaFill = document.createElement('span');
    var alphaMarker = document.createElement('span');
    var swatch;
    var color;
    var i;
    this.colorPanel.innerHTML = '';
    paletteElement.className = 'fg-color-palette';
    for (i = 0; i < palette.length; i += 1) {
      color = normalizeColorValue(palette[i]);
      if (!color) {
        continue;
      }
      swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'fg-color-palette-swatch';
      swatch.setAttribute('data-color', color);
      swatch.setAttribute('aria-label', color);
      swatch.title = color;
      swatch.style.backgroundColor = color;
      paletteElement.appendChild(swatch);
    }

    controls.className = 'fg-color-controls';
    sv.className = 'fg-color-sv';
    svMarker.className = 'fg-color-marker fg-color-sv-marker';
    sv.appendChild(svMarker);
    hue.className = 'fg-color-hue';
    hueMarker.className = 'fg-color-marker fg-color-hue-marker';
    hue.appendChild(hueMarker);
    alpha.className = 'fg-color-alpha';
    alphaFill.className = 'fg-color-alpha-fill';
    alphaMarker.className = 'fg-color-marker fg-color-alpha-marker';
    alpha.appendChild(alphaFill);
    alpha.appendChild(alphaMarker);
    controls.appendChild(sv);
    controls.appendChild(hue);
    if (getColorShowAlpha(config)) {
      controls.appendChild(alpha);
    }
    this.colorPanel.appendChild(paletteElement);
    this.colorPanel.appendChild(controls);
    this.updateColorPanelVisuals();
  };

  FabGrid.prototype.updateColorPanelVisuals = function() {
    var state = this.colorState || createColorState('#ff0000');
    var rgb = hsvToRgb(state.h, state.s, state.v);
    var sv = this.colorPanel.querySelector('.fg-color-sv');
    var svMarker = this.colorPanel.querySelector('.fg-color-sv-marker');
    var hueMarker = this.colorPanel.querySelector('.fg-color-hue-marker');
    var alphaFill = this.colorPanel.querySelector('.fg-color-alpha-fill');
    var alphaMarker = this.colorPanel.querySelector('.fg-color-alpha-marker');
    if (sv) {
      sv.style.backgroundColor = 'hsl(' + Math.round(state.h) + ', 100%, 50%)';
    }
    if (svMarker) {
      svMarker.style.left = (state.s * 100) + '%';
      svMarker.style.top = ((1 - state.v) * 100) + '%';
    }
    if (hueMarker) {
      hueMarker.style.top = (state.h / 360 * 100) + '%';
    }
    if (alphaFill) {
      alphaFill.style.backgroundImage = 'linear-gradient(to right, rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0), rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + '))';
    }
    if (alphaMarker) {
      alphaMarker.style.left = (state.a * 100) + '%';
    }
  };

  FabGrid.prototype.handleColorPanelPointerDown = function(event) {
    var paletteSwatch = closest(event.target, 'fg-color-palette-swatch');
    var area;
    var mode;
    var target = this.getColorTarget();
    var value;
    if (!this.isColorPanelOpen()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (paletteSwatch) {
      value = paletteSwatch.getAttribute('data-color') || '';
      this.colorState = createColorState(value);
      this.applyColorValueToTarget(value);
      this.updateColorPanelVisuals();
      if (target && target.type === 'search') {
        this.hideColorPanel();
        target.input.focus();
      }
      return;
    }
    area = closest(event.target, 'fg-color-sv');
    mode = 'sv';
    if (!area) {
      area = closest(event.target, 'fg-color-hue');
      mode = 'hue';
    }
    if (!area) {
      area = closest(event.target, 'fg-color-alpha');
      mode = 'alpha';
    }
    if (!area) {
      return;
    }
    this.colorDragState = { mode: mode, element: area, pointerId: event.pointerId };
    if (area.setPointerCapture && event.pointerId != null) {
      area.setPointerCapture(event.pointerId);
    }
    this.updateColorFromPointer(event);
  };

  FabGrid.prototype.handleColorPanelPointerMove = function(event) {
    if (!this.colorDragState) {
      return;
    }
    event.preventDefault();
    this.updateColorFromPointer(event);
  };

  FabGrid.prototype.handleColorPanelPointerUp = function(event) {
    var drag = this.colorDragState;
    var target = this.getColorTarget();
    if (!drag) {
      return;
    }
    if (drag.element.releasePointerCapture && drag.pointerId != null) {
      try {
        drag.element.releasePointerCapture(drag.pointerId);
      } catch (error) {
        // The pointer capture may already be released by the browser.
      }
    }
    this.colorDragState = null;
    if (target && target.type === 'search') {
      this.hideColorPanel();
      target.input.focus();
    }
    event.preventDefault();
  };

  FabGrid.prototype.updateColorFromPointer = function(event) {
    var drag = this.colorDragState;
    var rect;
    var x;
    var y;
    if (!drag || !drag.element) {
      return;
    }
    rect = drag.element.getBoundingClientRect();
    x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    this.colorState = this.colorState || createColorState('#ff0000');
    if (drag.mode === 'sv') {
      this.colorState.s = x;
      this.colorState.v = 1 - y;
    } else if (drag.mode === 'hue') {
      this.colorState.h = Math.min(359.999, y * 360);
    } else if (drag.mode === 'alpha') {
      this.colorState.a = x;
    }
    this.applyColorStateToEditor();
    this.updateColorPanelVisuals();
  };

  FabGrid.prototype.applyColorStateToEditor = function() {
    var target = this.getColorTarget();
    var config;
    if (!this.colorState || !target || !target.input) {
      return;
    }
    config = target.config || this.editorConfig;
    this.applyColorValueToTarget(colorStateToHex(this.colorState, getColorShowAlpha(config)));
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
    var fragment = document.createDocumentFragment();
    var item;
    var text;
    var value;
    var option;
    var matched = 0;
    var i;
    this.comboboxItems = [];
    this.comboboxActiveIndex = -1;
    this.comboboxPanel.innerHTML = '';
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      text = getComboboxItemText(item, config);
      value = String(getComboboxItemValue(item, config));
      if (query && text.toLowerCase().indexOf(query) < 0 && value.toLowerCase().indexOf(query) < 0) {
        continue;
      }
      option = document.createElement('button');
      option.type = 'button';
      option.className = 'fg-combobox-option';
      option.setAttribute('role', 'option');
      option.setAttribute('data-index', this.comboboxItems.length);
      renderComboboxOptionContent(option, text, value, config);
      fragment.appendChild(option);
      this.comboboxItems.push(item);
      matched += 1;
    }
    if (!matched) {
      option = document.createElement('div');
      option.className = 'fg-combobox-empty';
      option.textContent = '沒有符合項目';
      fragment.appendChild(option);
    }
    this.comboboxPanel.appendChild(fragment);
  };

  FabGrid.prototype.handleComboboxMouseDown = function(event) {
    var option = closest(event.target, 'fg-combobox-option');
    var index;
    if (!option || !this.comboboxTarget || !this.comboboxTarget.config || this.comboboxTarget.config.type !== 'combo') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    index = toNumber(option.getAttribute('data-index'), -1);
    this.selectComboboxOption(index);
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
    var options;
    var i;
    var option;
    if (!this.comboboxItems.length) {
      this.comboboxActiveIndex = -1;
      return;
    }
    index = clamp(index, 0, this.comboboxItems.length - 1);
    this.comboboxActiveIndex = index;
    options = this.comboboxPanel.querySelectorAll('.fg-combobox-option');
    for (i = 0; i < options.length; i += 1) {
      option = options[i];
      if (i === index) {
        option.className = 'fg-combobox-option fg-combobox-active';
        option.setAttribute('aria-selected', 'true');
        if (option.scrollIntoView) {
          option.scrollIntoView({ block: 'nearest' });
        }
      } else {
        option.className = 'fg-combobox-option';
        option.setAttribute('aria-selected', 'false');
      }
    }
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
    this.dateboxState = {
      year: date.getFullYear(),
      month: date.getMonth(),
      selected: date,
      mode: isYearMonthDateboxTarget(target) ? 'months' : 'calendar'
    };
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

  FabGrid.prototype.moveDateboxMonth = function(action) {
    var state = this.dateboxState || {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      selected: null,
      mode: 'calendar'
    };
    var date = new Date(state.year, state.month, 1);
    if (action === 'prev-year') {
      date.setFullYear(date.getFullYear() - 1);
    } else if (action === 'next-year') {
      date.setFullYear(date.getFullYear() + 1);
    } else if (action === 'prev-month') {
      date.setMonth(date.getMonth() - 1);
    } else if (action === 'next-month') {
      date.setMonth(date.getMonth() + 1);
    }
    this.dateboxState = {
      year: date.getFullYear(),
      month: date.getMonth(),
      selected: state.selected,
      mode: state.mode || 'calendar'
    };
    this.renderDateboxPanel();
  };

  FabGrid.prototype.renderDateboxPanel = function() {
    var state = this.dateboxState || {};
    var year = state.year || new Date().getFullYear();
    var month = state.month == null ? new Date().getMonth() : state.month;
    var mode = state.mode || 'calendar';
    var selectedIso = state.selected ? formatDateIso(state.selected) : '';
    var todayIso = formatDateIso(new Date());
    var first = new Date(year, month, 1);
    var start = new Date(year, month, 1 - first.getDay());
    var labels = this.getWeekdayNames();
    var html = [];
    var i;
    var d;
    var iso;
    var className;
    html.push('<div class="fg-datebox-header">');
    html.push('<button type="button" class="fg-datebox-control" data-action="prev-year">«</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="prev-month">‹</button>');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-title fg-datebox-title-button" data-action="months">' + this.getMonthTitle(year, month) + '</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="next-month">›</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="next-year">»</button>');
    html.push('</div>');
    if (mode === 'months') {
      this.renderDateboxMonthView(html, year, month);
      if (!isYearMonthDateboxTarget(this.dateboxTarget)) {
        this.renderDateboxFooter(html);
      }
      this.dateboxPanel.innerHTML = html.join('');
      return;
    }
    html.push('<div class="fg-datebox-weekdays">');
    for (i = 0; i < labels.length; i += 1) {
      html.push('<span>' + escapeHtml(labels[i]) + '</span>');
    }
    html.push('</div>');
    html.push('<div class="fg-datebox-days">');
    for (i = 0; i < 42; i += 1) {
      d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      iso = formatDateIso(d);
      className = 'fg-datebox-day';
      if (d.getMonth() !== month) {
        className += ' fg-datebox-other-month';
      }
      if (d.getDay() === 0) {
        className += ' fg-datebox-sunday';
      } else if (d.getDay() === 6) {
        className += ' fg-datebox-saturday';
      }
      if (iso === todayIso) {
        className += ' fg-datebox-today';
      }
      if (iso === selectedIso) {
        className += ' fg-datebox-selected';
      }
      html.push('<button type="button" class="' + className + '" data-date="' + iso + '">' + d.getDate() + '</button>');
    }
    html.push('</div>');
    this.renderDateboxFooter(html);
    this.dateboxPanel.innerHTML = html.join('');
  };

  FabGrid.prototype.renderDateboxMonthView = function(html, year, month) {
    var labels = this.getMonthNames();
    var i;
    var className;
    html.push('<div class="fg-datebox-month-view">');
    html.push('<div class="fg-datebox-year-row">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-year-control" data-action="prev-year">«</button>');
    html.push('<input class="fg-datebox-year-input" type="number" min="1" max="9999" value="' + year + '" aria-label="' + escapeHtml(this.getText('aria.year')) + '">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-year-control" data-action="next-year">»</button>');
    html.push('</div>');
    html.push('<div class="fg-datebox-months">');
    for (i = 0; i < labels.length; i += 1) {
      className = 'fg-datebox-month';
      if (i === month) {
        className += ' fg-datebox-month-selected';
      }
      html.push('<button type="button" class="' + className + '" data-month="' + i + '">' + escapeHtml(labels[i]) + '</button>');
    }
    html.push('</div>');
    html.push('</div>');
  };

  FabGrid.prototype.renderDateboxFooter = function(html) {
    html.push('<div class="fg-datebox-footer">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-footer-button" data-action="today">' + escapeHtml(this.getText('datebox.today')) + '</button>');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-footer-button" data-action="close">' + escapeHtml(this.getText('datebox.close')) + '</button>');
    html.push('</div>');
  };

  FabGrid.prototype.getMonthNames = function() {
    var names = this.getText('datebox.months');
    return names && names.length ? names : [];
  };

  FabGrid.prototype.getWeekdayNames = function() {
    var names = this.getText('datebox.weekdays');
    return names && names.length ? names : [];
  };

  FabGrid.prototype.getMonthTitle = function(year, month) {
    var names = this.getMonthNames();
    return escapeHtml(formatLocaleText(this.getText('datebox.monthTitle'), {
      month: names[month] || String(month + 1),
      year: year
    }));
  };

  FabGrid.prototype.positionDateboxPanel = function(left, top, width) {
    var panelWidth = Math.max(250, width);
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - 282);
    this.dateboxPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.dateboxPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.dateboxPanel.style.width = panelWidth + 'px';
  };

  FabGrid.prototype.positionComboboxPanel = function(left, top, width) {
    var maxWidth = Math.max(120, this.root.clientWidth - 4);
    var contentWidth = this.measureComboboxPanelWidth();
    var panelWidth = Math.min(maxWidth, Math.max(120, width, contentWidth));
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - 180);
    this.comboboxPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.comboboxPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.comboboxPanel.style.width = panelWidth + 'px';
  };

  FabGrid.prototype.positionColorPanel = function(left, top) {
    var panelWidth = Math.min(420, Math.max(260, this.root.clientWidth - 4));
    var panelHeight = Math.max(190, this.colorPanel.offsetHeight || 210);
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - panelHeight - 2);
    this.colorPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.colorPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.colorPanel.style.width = panelWidth + 'px';
  };

  FabGrid.prototype.measureComboboxPanelWidth = function() {
    var previousWidth;
    var width;
    if (!this.comboboxPanel) {
      return 0;
    }
    previousWidth = this.comboboxPanel.style.width;
    this.comboboxPanel.style.width = 'auto';
    width = Math.ceil(this.comboboxPanel.scrollWidth || this.comboboxPanel.offsetWidth || 0);
    this.comboboxPanel.style.width = previousWidth;
    return width + 2;
  };

  FabGrid.prototype.clearEditingState = function() {
    this.editing = null;
    this.editorConfig = null;
    this.editorIconConfigs = [];
    this.dateboxState = null;
    this.comboboxItems = [];
    this.colorState = null;
    this.colorDragState = null;
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
    if (!column && this.editing) {
      column = this.visibleColumns[this.editing.col];
    }
    var config = getColumnEditorConfig(column);
    var mask = getExplicitEditorMask(column);
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
