var HTML_EDITOR_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

var HTML_EDITOR_LOCALES = {
  en: {
    ariaLabel: 'HTML editor',
    style: 'Style',
    paragraph: 'Paragraph',
    blockquote: 'Blockquote',
    pre: 'Preformatted',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    heading4: 'Heading 4',
    heading5: 'Heading 5',
    heading6: 'Heading 6',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    superscript: 'Superscript',
    subscript: 'Subscript',
    clear: 'Clear formatting',
    fontName: 'Font family',
    fontSize: 'Font size',
    color: 'Text color',
    backColor: 'Background color',
    clearColor: 'Clear color',
    unorderedList: 'Unordered list',
    orderedList: 'Ordered list',
    paragraphTools: 'Paragraph',
    alignLeft: 'Align left',
    alignCenter: 'Align center',
    alignRight: 'Align right',
    justify: 'Justify',
    outdent: 'Outdent',
    indent: 'Indent',
    table: 'Table',
    insertTable: 'Insert {0} × {1} table',
    link: 'Link',
    picture: 'Picture',
    video: 'Video',
    horizontalRule: 'Horizontal rule',
    undo: 'Undo',
    redo: 'Redo',
    fullscreen: 'Fullscreen',
    codeView: 'Code view',
    help: 'Help',
    linkDialog: 'Insert link',
    linkText: 'Text to display',
    linkUrl: 'URL',
    openNewWindow: 'Open in new window',
    pictureDialog: 'Insert picture',
    pictureUrl: 'Picture URL',
    pictureAlt: 'Alternative text',
    pictureFile: 'Local picture',
    choosePicture: 'Choose picture',
    videoDialog: 'Insert video',
    videoUrl: 'Video or embed URL',
    insert: 'Insert',
    cancel: 'Cancel',
    helpDialog: 'Keyboard shortcuts',
    helpContent: 'Ctrl/⌘ + B: bold\nCtrl/⌘ + I: italic\nCtrl/⌘ + U: underline\nCtrl/⌘ + Z: undo\nCtrl/⌘ + Y or Ctrl/⌘ + Shift + Z: redo\nEscape: close popup or fullscreen',
    invalidUrl: 'Enter a valid URL.',
    resize: 'Resize editor'
  },
  'zh-TW': {
    ariaLabel: 'HTML 編輯器',
    style: '樣式',
    paragraph: '段落',
    blockquote: '引言',
    pre: '預先格式化',
    heading1: '標題 1',
    heading2: '標題 2',
    heading3: '標題 3',
    heading4: '標題 4',
    heading5: '標題 5',
    heading6: '標題 6',
    bold: '粗體',
    italic: '斜體',
    underline: '底線',
    strikethrough: '刪除線',
    superscript: '上標',
    subscript: '下標',
    clear: '清除格式',
    fontName: '字型',
    fontSize: '字級',
    color: '文字顏色',
    backColor: '文字底色',
    clearColor: '清除顏色',
    unorderedList: '項目符號',
    orderedList: '編號',
    paragraphTools: '段落',
    alignLeft: '靠左對齊',
    alignCenter: '置中對齊',
    alignRight: '靠右對齊',
    justify: '左右對齊',
    outdent: '減少縮排',
    indent: '增加縮排',
    table: '表格',
    insertTable: '插入 {0} × {1} 表格',
    link: '連結',
    picture: '圖片',
    video: '影片',
    horizontalRule: '水平線',
    undo: '復原',
    redo: '重做',
    fullscreen: '全螢幕',
    codeView: 'HTML 原始碼',
    help: '說明',
    linkDialog: '插入連結',
    linkText: '顯示文字',
    linkUrl: '網址',
    openNewWindow: '在新視窗開啟',
    pictureDialog: '插入圖片',
    pictureUrl: '圖片網址',
    pictureAlt: '替代文字',
    pictureFile: '本機圖片',
    choosePicture: '選擇圖片',
    videoDialog: '插入影片',
    videoUrl: '影片或嵌入網址',
    insert: '插入',
    cancel: '取消',
    helpDialog: '鍵盤快速鍵',
    helpContent: 'Ctrl/⌘ + B：粗體\nCtrl/⌘ + I：斜體\nCtrl/⌘ + U：底線\nCtrl/⌘ + Z：復原\nCtrl/⌘ + Y 或 Ctrl/⌘ + Shift + Z：重做\nEscape：關閉選單或全螢幕',
    invalidUrl: '請輸入有效網址。',
    resize: '調整編輯器高度'
  },
  'zh-CN': {
    ariaLabel: 'HTML 编辑器',
    style: '样式',
    paragraph: '段落',
    blockquote: '引用',
    pre: '预先格式化',
    heading1: '标题 1',
    heading2: '标题 2',
    heading3: '标题 3',
    heading4: '标题 4',
    heading5: '标题 5',
    heading6: '标题 6',
    bold: '粗体',
    italic: '斜体',
    underline: '下划线',
    strikethrough: '删除线',
    superscript: '上标',
    subscript: '下标',
    clear: '清除格式',
    fontName: '字体',
    fontSize: '字号',
    color: '文字颜色',
    backColor: '文字底色',
    clearColor: '清除颜色',
    unorderedList: '项目符号',
    orderedList: '编号',
    paragraphTools: '段落',
    alignLeft: '左对齐',
    alignCenter: '居中对齐',
    alignRight: '右对齐',
    justify: '两端对齐',
    outdent: '减少缩进',
    indent: '增加缩进',
    table: '表格',
    insertTable: '插入 {0} × {1} 表格',
    link: '链接',
    picture: '图片',
    video: '视频',
    horizontalRule: '水平线',
    undo: '撤销',
    redo: '重做',
    fullscreen: '全屏',
    codeView: 'HTML 源码',
    help: '帮助',
    linkDialog: '插入链接',
    linkText: '显示文字',
    linkUrl: '网址',
    openNewWindow: '在新窗口打开',
    pictureDialog: '插入图片',
    pictureUrl: '图片网址',
    pictureAlt: '替代文字',
    pictureFile: '本地图片',
    choosePicture: '选择图片',
    videoDialog: '插入视频',
    videoUrl: '视频或嵌入网址',
    insert: '插入',
    cancel: '取消',
    helpDialog: '键盘快捷键',
    helpContent: 'Ctrl/⌘ + B：粗体\nCtrl/⌘ + I：斜体\nCtrl/⌘ + U：下划线\nCtrl/⌘ + Z：撤销\nCtrl/⌘ + Y 或 Ctrl/⌘ + Shift + Z：重做\nEscape：关闭菜单或全屏',
    invalidUrl: '请输入有效网址。',
    resize: '调整编辑器高度'
  }
};

var DEFAULT_TOOLBAR = [
  ['style', ['style']],
  ['font', ['bold', 'italic', 'underline', 'clear']],
  ['fontname', ['fontname']],
  ['color', ['color', 'backcolor']],
  ['para', ['ul', 'ol', 'paragraph']],
  ['table', ['table']],
  ['insert', ['link', 'picture', 'video', 'hr']],
  ['history', ['undo', 'redo']],
  ['view', ['fullscreen', 'codeview', 'help']]
];

var ACTION_LABELS = {
  style: ['', 'style', 'icon-html-editor-style'],
  bold: ['', 'bold', 'icon-html-editor-bold'],
  italic: ['', 'italic', 'icon-html-editor-italic'],
  underline: ['', 'underline', 'icon-html-editor-underline'],
  strikethrough: ['', 'strikethrough', 'icon-html-editor-strikethrough'],
  superscript: ['', 'superscript', 'icon-html-editor-superscript'],
  subscript: ['', 'subscript', 'icon-html-editor-subscript'],
  clear: ['', 'clear', 'icon-html-editor-clear'],
  fontname: ['A', 'fontName'],
  fontsize: ['12', 'fontSize'],
  color: ['', 'color', 'icon-html-editor-color'],
  backcolor: ['', 'backColor', 'icon-html-editor-backcolor'],
  ul: ['', 'unorderedList', 'icon-html-editor-ul'],
  ol: ['', 'orderedList', 'icon-html-editor-ol'],
  paragraph: ['', 'paragraphTools', 'icon-html-editor-paragraph'],
  table: ['', 'table', 'icon-html-editor-table'],
  link: ['', 'link', 'icon-html-editor-link'],
  picture: ['', 'picture', 'icon-html-editor-picture'],
  video: ['', 'video', 'icon-html-editor-video'],
  hr: ['', 'horizontalRule', 'icon-html-editor-hr'],
  undo: ['', 'undo', 'icon-html-editor-undo'],
  redo: ['', 'redo', 'icon-html-editor-redo'],
  fullscreen: ['', 'fullscreen', 'icon-html-editor-fullscreen'],
  codeview: ['', 'codeView', 'icon-html-editor-codeview'],
  help: ['', 'help', 'icon-html-editor-help']
};

var activeHtmlEditorPopup = null;
var activeFullscreenEditor = null;
var htmlEditorFieldSequence = 1;

function assignHtmlEditorOptions(target) {
  var index;
  var source;
  var key;
  for (index = 1; index < arguments.length; index += 1) {
    source = arguments[index] || {};
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
    }
  }
  return target;
}

function resolveHtmlEditorElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function restoreHtmlEditorAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function htmlEditorNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function htmlEditorCssSize(value) {
  if (value == null || value === '') return '';
  return typeof value === 'number' ? value + 'px' : String(value);
}

function escapeHtmlEditorText(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatHtmlEditorText(value) {
  var args = arguments;
  return String(value || '').replace(/\{(\d+)\}/g, function(match, index) {
    index = Number(index) + 1;
    return args[index] == null ? match : args[index];
  });
}

export function normalizeHtmlEditorLocale(value) {
  var locale = String(value || 'en').replace(/_/g, '-').toLowerCase();
  if (locale === 'zh-hant' || locale === 'zh-hant-tw' || locale === 'zh-tw') {
    return 'zh-TW';
  }
  if (locale === 'zh-hans' || locale === 'zh-hans-cn' || locale === 'zh-cn') {
    return 'zh-CN';
  }
  return 'en';
}

export function normalizeHtmlEditorTheme(value) {
  var theme = String(value == null ? 'inherit' : value).trim().toLowerCase();
  if (theme === 'inherit') return 'inherit';
  if (theme === 'pepper') theme = 'pepper-grinder';
  return HTML_EDITOR_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeHtmlEditorToolbar(value) {
  if (!Array.isArray(value)) return DEFAULT_TOOLBAR.map(function(group) {
    return [group[0], group[1].slice()];
  });
  return value.reduce(function(result, group) {
    var name;
    var actions;
    if (!Array.isArray(group) || !Array.isArray(group[1])) return result;
    name = String(group[0] || '').trim();
    actions = group[1].filter(function(action) {
      return Object.prototype.hasOwnProperty.call(ACTION_LABELS, action);
    });
    if (actions.length) result.push([name, actions]);
    return result;
  }, []);
}

function safeHtmlEditorUrl(value, kind) {
  var text = String(value || '').trim();
  var url;
  if (!text) return '';
  if (kind === 'image' && /^data:image\/(?:png|gif|jpe?g|webp|svg\+xml);base64,/i.test(text)) {
    return text;
  }
  if (kind === 'link' && /^(?:#|mailto:|tel:)/i.test(text)) return text;
  try {
    url = new URL(text, typeof document !== 'undefined' ? document.baseURI : undefined);
  } catch (error) {
    return '';
  }
  return /^(?:https?:)$/i.test(url.protocol) ? url.href : '';
}

export function htmlEditorVideoMarkup(value) {
  var url = safeHtmlEditorUrl(value, 'video');
  var match;
  if (!url) return '';
  match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (match) {
    return '<iframe src="https://www.youtube-nocookie.com/embed/' +
      escapeHtmlEditorText(match[1]) +
      '" title="YouTube video" loading="lazy" allowfullscreen></iframe>';
  }
  match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (match) {
    return '<iframe src="https://player.vimeo.com/video/' +
      escapeHtmlEditorText(match[1]) +
      '" title="Vimeo video" loading="lazy" allowfullscreen></iframe>';
  }
  if (/\.(?:mp4|webm|ogg)(?:[?#].*)?$/i.test(url)) {
    return '<video src="' + escapeHtmlEditorText(url) + '" controls></video>';
  }
  return '<iframe src="' + escapeHtmlEditorText(url) +
    '" title="Embedded video" loading="lazy" allowfullscreen></iframe>';
}

export function createHtmlEditorFactory(fabui) {
  var Control;
  var registerControl;
  var unregisterControl;
  var Button;
  var Window;
  var EditBox;
  var CheckBox;
  var FileBox;

  if (!fabui || typeof fabui.Control !== 'function') {
    throw new Error('fabui.HtmlEditor requires fabui.Control. Load FabUI core first.');
  }
  Control = fabui.Control;
  registerControl = Control._registerControl;
  unregisterControl = Control._unregisterControl;
  Button = fabui.Button;
  Window = fabui.Window;
  EditBox = fabui.EditBox;
  CheckBox = fabui.CheckBox;
  FileBox = fabui.FileBox;
  if (
    typeof registerControl !== 'function' ||
    typeof unregisterControl !== 'function' ||
    typeof Button !== 'function' ||
    typeof Window !== 'function' ||
    typeof EditBox !== 'function' ||
    typeof CheckBox !== 'function' ||
    typeof FileBox !== 'function'
  ) {
    throw new Error(
      'fabui.HtmlEditor requires fabui.Button, Window, EditBox, CheckBox and FileBox.'
    );
  }

  function HtmlEditor(element, options) {
    var host = resolveHtmlEditorElement(element);
    if (!(this instanceof HtmlEditor)) return new HtmlEditor(element, options);
    if (!host) throw new Error('fabui.HtmlEditor requires a host element.');
    if (host.__fabuiHtmlEditor) return host.__fabuiHtmlEditor;
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._toolbarControls = [];
    this._actionControls = {};
    this._selectionRange = null;
    this._dialog = null;
    this._fileReader = null;
    this._codeView = false;
    this._fullscreen = false;
    this._dragState = null;
    this._lastValue = '';
    this._isTextarea = host.tagName === 'TEXTAREA';
    this._original = {
      hidden: host.hidden,
      className: host.getAttribute('class'),
      style: host.getAttribute('style'),
      ariaHidden: host.getAttribute('aria-hidden'),
      html: host.innerHTML,
      value: this._isTextarea ? host.value : null
    };
    this.options = assignHtmlEditorOptions(
      {},
      HtmlEditor.defaults,
      this._readElementOptions(),
      options || {}
    );
    this.options.locale = normalizeHtmlEditorLocale(this.options.locale);
    this.options.theme = normalizeHtmlEditorTheme(this.options.theme);
    this.options.toolbar = normalizeHtmlEditorToolbar(this.options.toolbar);
    this.options.height = Math.max(80, htmlEditorNumber(this.options.height, 300));
    this.options.minHeight = Math.max(60, htmlEditorNumber(this.options.minHeight, 120));
    this.options.maxHeight = Math.max(
      this.options.minHeight,
      htmlEditorNumber(this.options.maxHeight, 800)
    );
    this._build();
    this._bind();
    host.__fabuiHtmlEditor = this;
    registerControl(host, this);
    registerControl(this.rootElement, this);
    this.setLocale(this.options.locale, this.options.messages);
    this.setTheme(this.options.theme);
    this.setValue(
      Object.prototype.hasOwnProperty.call(options || {}, 'value') ?
        options.value : this._initialValue(),
      true
    );
    this.resize({ width: this.options.width, height: this.options.height }, true);
    this._applyState();
    if (this.options.focus) this.focus();
    this._fire('Init', { value: this.getValue() });
  }

  HtmlEditor.prototype = Object.create(Control.prototype);
  HtmlEditor.prototype.constructor = HtmlEditor;

  HtmlEditor.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = {};
    var value;
    value = host.getAttribute('placeholder');
    if (value != null) options.placeholder = value;
    value = host.getAttribute('data-locale') || host.getAttribute('lang');
    if (value) options.locale = value;
    value = host.getAttribute('data-theme');
    if (value) options.theme = value;
    if (host.style.width) options.width = host.style.width;
    if (host.style.height) options.height = parseFloat(host.style.height);
    if (host.hasAttribute('disabled')) options.disabled = true;
    if (host.hasAttribute('readonly')) options.readOnly = true;
    return options;
  };

  HtmlEditor.prototype._initialValue = function() {
    return this._isTextarea ? this.hostElement.value : this.hostElement.innerHTML;
  };

  HtmlEditor.prototype._build = function() {
    var root = document.createElement('div');
    var toolbar = document.createElement('div');
    var editingArea = document.createElement('div');
    var editable = document.createElement('div');
    var code = document.createElement('textarea');
    var resize = document.createElement('div');
    root.className = 'fui-html-editor';
    root.setAttribute('role', 'group');
    toolbar.className = 'fui-html-editor-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    editingArea.className = 'fui-html-editor-area';
    editable.className = 'fui-html-editor-editable';
    editable.contentEditable = 'true';
    editable.setAttribute('role', 'textbox');
    editable.setAttribute('aria-multiline', 'true');
    editable.setAttribute('data-placeholder', String(this.options.placeholder || ''));
    editable.spellcheck = this.options.spellcheck !== false;
    code.className = 'fui-html-editor-code';
    code.hidden = true;
    code.spellcheck = false;
    resize.className = 'fui-html-editor-resize';
    resize.setAttribute('role', 'separator');
    resize.setAttribute('aria-orientation', 'horizontal');
    resize.tabIndex = 0;
    editingArea.appendChild(editable);
    editingArea.appendChild(code);
    root.appendChild(toolbar);
    root.appendChild(editingArea);
    root.appendChild(resize);
    this.hostElement.hidden = true;
    this.hostElement.setAttribute('aria-hidden', 'true');
    this.hostElement.insertAdjacentElement('afterend', root);
    this.rootElement = root;
    this.toolbarElement = toolbar;
    this.areaElement = editingArea;
    this.editableElement = editable;
    this.codeElement = code;
    this.resizeElement = resize;
    this._buildToolbar();
  };

  HtmlEditor.prototype._buildToolbar = function() {
    var self = this;
    this.toolbarElement.textContent = '';
    this._toolbarControls.forEach(function(control) { control.dispose(); });
    this._toolbarControls = [];
    this._actionControls = {};
    this.options.toolbar.forEach(function(groupDefinition) {
      var group = document.createElement('div');
      group.className = 'fui-html-editor-group';
      group.setAttribute('data-group', groupDefinition[0]);
      groupDefinition[1].forEach(function(action) {
        group.appendChild(self._createToolbarAction(action));
      });
      self.toolbarElement.appendChild(group);
    });
  };

  HtmlEditor.prototype._createToolbarAction = function(action) {
    var self = this;
    var definition = ACTION_LABELS[action];
    var host = document.createElement('a');
    var dropdown = [
      'style', 'fontname', 'fontsize', 'color', 'backcolor', 'paragraph', 'table'
    ]
      .indexOf(action) >= 0;
    var control;
    host.href = 'javascript:void(0)';
    host.className = 'fui-html-editor-action fui-html-editor-action-' + action;
    if (dropdown) host.classList.add('fui-html-editor-dropdown');
    host.setAttribute('data-action', action);
    host.setAttribute('aria-label', this._text(definition[1]));
    host.title = this._text(definition[1]);
    if (dropdown) host.setAttribute('aria-haspopup', 'menu');
    control = new Button(host, {
      text: definition[0],
      iconCls: definition[2] || null,
      plain: true,
      toggle: ['bold', 'italic', 'underline', 'strikethrough', 'superscript',
        'subscript', 'fullscreen', 'codeview'].indexOf(action) >= 0,
      cls: 'fui-html-editor-tool',
      theme: 'inherit',
      onClick: function() {
        self._handleAction(action, host);
        return false;
      }
    });
    host.addEventListener('pointerdown', function(event) {
      self._saveSelection();
      event.preventDefault();
    });
    this._toolbarControls.push(control);
    this._actionControls[action] = control;
    return host;
  };

  HtmlEditor.prototype._bind = function() {
    var self = this;
    this._onInput = function() {
      self._saveSelection();
      self._syncSource(false, 'input');
    };
    this._onFocus = function(event) {
      self.rootElement.classList.add('fui-html-editor-focused');
      if (event.target === self.editableElement) {
        self.addEventListener(document, 'selectionchange', self._onSelectionChange);
      }
      self._fire('Focus', { originalEvent: event });
    };
    this._onBlur = function(event) {
      self.rootElement.classList.remove('fui-html-editor-focused');
      if (event.target === self.editableElement) {
        self.removeEventListener(document, 'selectionchange', self._onSelectionChange);
      }
      self._fire('Blur', { originalEvent: event });
    };
    this._onSelectionChange = function() {
      if (self._selectionBelongsToEditor()) {
        self._saveSelection();
        self._updateToolbarState();
      }
    };
    this._onEditableKeyDown = function(event) {
      self._handleKeyDown(event);
    };
    this._onRootKeyDown = function(event) {
      if (event.key !== 'Escape') return;
      if (self._dialog) return;
      if (self._popupElement) {
        self._closePopup();
        event.preventDefault();
      } else if (self._fullscreen) {
        self.toggleFullscreen(false);
        event.preventDefault();
      }
    };
    this._onResizePointerDown = function(event) {
      self._startResize(event);
    };
    this._onResizeKeyDown = function(event) {
      var height;
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      height = self.editableElement.getBoundingClientRect().height;
      height += event.key === 'ArrowDown' ? 10 : -10;
      self.resize({ height: height });
      event.preventDefault();
    };
    this._onFormReset = function() {
      setTimeout(function() {
        if (!self._destroyed) self.setValue(self._initialValue(), true);
      }, 0);
    };
    this.addEventListener(this.editableElement, 'input', this._onInput);
    this.addEventListener(this.codeElement, 'input', this._onInput);
    this.addEventListener(this.editableElement, 'focus', this._onFocus);
    this.addEventListener(this.editableElement, 'blur', this._onBlur);
    this.addEventListener(this.codeElement, 'focus', this._onFocus);
    this.addEventListener(this.codeElement, 'blur', this._onBlur);
    this.addEventListener(this.editableElement, 'keydown', this._onEditableKeyDown);
    this.addEventListener(this.codeElement, 'keydown', this._onEditableKeyDown);
    this.addEventListener(this.rootElement, 'keydown', this._onRootKeyDown);
    this.addEventListener(this.resizeElement, 'pointerdown', this._onResizePointerDown);
    this.addEventListener(this.resizeElement, 'keydown', this._onResizeKeyDown);
    if (this.hostElement.form) {
      this.addEventListener(this.hostElement.form, 'reset', this._onFormReset);
    }
  };

  HtmlEditor.prototype._text = function(key) {
    return this._messages && this._messages[key] != null ? this._messages[key] : key;
  };

  HtmlEditor.prototype._selectionBelongsToEditor = function() {
    var selection = window.getSelection && window.getSelection();
    var node;
    if (!selection || !selection.rangeCount) return false;
    node = selection.anchorNode;
    return !!node && this.editableElement.contains(
      node.nodeType === 1 ? node : node.parentNode
    );
  };

  HtmlEditor.prototype._saveSelection = function() {
    var selection;
    if (this._codeView || typeof window.getSelection !== 'function') return;
    selection = window.getSelection();
    if (!selection.rangeCount || !this._selectionBelongsToEditor()) return;
    this._selectionRange = selection.getRangeAt(0).cloneRange();
  };

  HtmlEditor.prototype._restoreSelection = function() {
    var selection;
    if (this._codeView) {
      this.codeElement.focus();
      return;
    }
    this.editableElement.focus();
    if (!this._selectionRange || typeof window.getSelection !== 'function') return;
    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(this._selectionRange);
  };

  HtmlEditor.prototype._handleKeyDown = function(event) {
    var meta = event.ctrlKey || event.metaKey;
    var key = String(event.key || '').toLowerCase();
    if (!meta || event.altKey) return;
    if (key === 'b' || key === 'i' || key === 'u') {
      event.preventDefault();
      this._exec({ b: 'bold', i: 'italic', u: 'underline' }[key]);
    } else if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      this._exec('redo');
    } else if (key === 'z') {
      event.preventDefault();
      this._exec('undo');
    } else if (key === 'y') {
      event.preventDefault();
      this._exec('redo');
    }
  };

  HtmlEditor.prototype._handleAction = function(action, trigger) {
    if (this.options.disabled) return;
    if (this._codeView && ['codeview', 'fullscreen', 'help'].indexOf(action) < 0) return;
    if (this.options.readOnly && ['codeview', 'fullscreen', 'help'].indexOf(action) < 0) return;
    if ([
      'style', 'fontname', 'fontsize', 'color', 'backcolor', 'paragraph', 'table'
    ].indexOf(action) >= 0) {
      this._openActionPopup(action, trigger);
      return;
    }
    if ({
      bold: 1,
      italic: 1,
      underline: 1,
      strikethrough: 1,
      superscript: 1,
      subscript: 1,
      undo: 1,
      redo: 1
    }[action]) {
      this._exec(action);
    } else if (action === 'clear') {
      this._exec('removeFormat');
    } else if (action === 'ul') {
      this._exec('insertUnorderedList');
    } else if (action === 'ol') {
      this._exec('insertOrderedList');
    } else if (action === 'hr') {
      this._insertHtml('<hr>');
    } else if (action === 'link' || action === 'picture' || action === 'video') {
      this._openDialog(action);
    } else if (action === 'fullscreen') {
      this.toggleFullscreen();
    } else if (action === 'codeview') {
      this.toggleCodeView();
    } else if (action === 'help') {
      this._openDialog('help');
    }
  };

  HtmlEditor.prototype._exec = function(command, value) {
    if (this._codeView || this.options.disabled || this.options.readOnly) return false;
    this._restoreSelection();
    try {
      document.execCommand(command, false, value == null ? null : value);
    } catch (error) {
      this._fire('Error', { command: command, error: error });
      return false;
    }
    this._saveSelection();
    this._syncSource(false, 'command');
    this._updateToolbarState();
    return true;
  };

  HtmlEditor.prototype._insertHtml = function(markup) {
    return this._exec('insertHTML', markup);
  };

  HtmlEditor.prototype._updateToolbarState = function() {
    var self = this;
    var commands = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'strikeThrough',
      superscript: 'superscript',
      subscript: 'subscript'
    };
    Object.keys(commands).forEach(function(action) {
      var control = self._actionControls[action];
      var active = false;
      if (!control || self._codeView) return;
      try {
        active = document.queryCommandState(commands[action]);
      } catch (error) {
        active = false;
      }
      if (active) control.select(true);
      else control.unselect(true);
    });
  };

  HtmlEditor.prototype._openActionPopup = function(action, trigger) {
    var self = this;
    var popup = this._createPopup(trigger);
    var items;
    var colors;
    var rows;
    var columns;
    var grid;
    function item(text, callback, className) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'fui-html-editor-popup-item' +
        (className ? ' ' + className : '');
      button.textContent = text;
      button.setAttribute('role', 'menuitem');
      button.addEventListener('click', function() {
        self._closePopup();
        callback();
      });
      popup.appendChild(button);
      return button;
    }
    if (action === 'style') {
      items = [
        ['p', 'paragraph'], ['blockquote', 'blockquote'], ['pre', 'pre'],
        ['h1', 'heading1'], ['h2', 'heading2'], ['h3', 'heading3'],
        ['h4', 'heading4'], ['h5', 'heading5'], ['h6', 'heading6']
      ];
      items.forEach(function(definition) {
        item(self._text(definition[1]), function() {
          self._exec('formatBlock', '<' + definition[0] + '>');
        }, 'fui-html-editor-style-' + definition[0]);
      });
    } else if (action === 'fontname') {
      this.options.fontNames.forEach(function(font) {
        item(font, function() { self._exec('fontName', font); })
          .style.fontFamily = font;
      });
    } else if (action === 'fontsize') {
      this.options.fontSizes.forEach(function(size, index) {
        item(String(size), function() {
          self._exec('fontSize', String(Math.min(7, index + 1)));
        }).style.fontSize = size + 'px';
      });
    } else if (action === 'paragraph') {
      [
        ['alignLeft', 'justifyLeft'], ['alignCenter', 'justifyCenter'],
        ['alignRight', 'justifyRight'], ['justify', 'justifyFull'],
        ['outdent', 'outdent'], ['indent', 'indent']
      ].forEach(function(definition) {
        item(self._text(definition[0]), function() { self._exec(definition[1]); });
      });
    } else if (action === 'color' || action === 'backcolor') {
      colors = this.options.colors;
      popup.classList.add('fui-html-editor-color-popup');
      colors.slice(0, -1).forEach(function(color) {
        var swatch = item(color, function() {
          self._exec(action === 'color' ? 'foreColor' : 'backColor', color);
        },
          'fui-html-editor-color');
        swatch.style.backgroundColor = color;
        swatch.title = color;
        swatch.setAttribute('aria-label', color);
      });
      var clearSwatch = item(self._text('clearColor'), function() {
        self._exec('removeFormat');
      }, 'fui-html-editor-color fui-html-editor-color-clear');
      clearSwatch.title = self._text('clearColor');
      clearSwatch.setAttribute('aria-label', self._text('clearColor'));
    } else if (action === 'table') {
      popup.classList.add('fui-html-editor-table-popup');
      grid = document.createElement('div');
      grid.className = 'fui-html-editor-table-grid';
      popup.appendChild(grid);
      for (rows = 1; rows <= 8; rows += 1) {
        for (columns = 1; columns <= 10; columns += 1) {
          (function(rowCount, columnCount) {
            var cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'fui-html-editor-table-cell';
            cell.title = formatHtmlEditorText(
              self._text('insertTable'),
              rowCount,
              columnCount
            );
            cell.setAttribute('aria-label', cell.title);
            cell.addEventListener('pointerenter', function() {
              Array.prototype.forEach.call(grid.children, function(candidate, index) {
                var candidateRow = Math.floor(index / 10) + 1;
                var candidateColumn = index % 10 + 1;
                candidate.classList.toggle(
                  'fui-html-editor-table-cell-active',
                  candidateRow <= rowCount && candidateColumn <= columnCount
                );
              });
            });
            cell.addEventListener('click', function() {
              self._closePopup();
              self._insertTable(rowCount, columnCount);
            });
            grid.appendChild(cell);
          }(rows, columns));
        }
      }
    }
    this._positionPopup(trigger);
  };

  HtmlEditor.prototype._createPopup = function(trigger) {
    var self = this;
    var popup;
    if (activeHtmlEditorPopup && activeHtmlEditorPopup !== this) {
      activeHtmlEditorPopup._closePopup();
    }
    this._closePopup();
    popup = document.createElement('div');
    popup.className = 'fui-html-editor-popup';
    popup.setAttribute('role', 'menu');
    popup.tabIndex = -1;
    document.body.appendChild(popup);
    this._popupElement = popup;
    this._popupTrigger = trigger;
    activeHtmlEditorPopup = this;
    trigger.setAttribute('aria-expanded', 'true');
    this._onPopupPointerDown = function(event) {
      if (popup.contains(event.target) || trigger.contains(event.target)) return;
      self._closePopup();
    };
    this._onPopupKeyDown = function(event) {
      if (event.key !== 'Escape') return;
      self._closePopup();
      trigger.focus();
      event.preventDefault();
    };
    this._onPopupViewport = function() { self._positionPopup(trigger); };
    document.addEventListener('pointerdown', this._onPopupPointerDown, true);
    document.addEventListener('keydown', this._onPopupKeyDown);
    window.addEventListener('resize', this._onPopupViewport);
    window.addEventListener('scroll', this._onPopupViewport, true);
    return popup;
  };

  HtmlEditor.prototype._positionPopup = function(trigger) {
    var popup = this._popupElement;
    var rect;
    var width;
    var height;
    var left;
    var top;
    if (!popup || !trigger) return;
    rect = trigger.getBoundingClientRect();
    width = popup.offsetWidth;
    height = popup.offsetHeight;
    left = rect.left + window.scrollX;
    top = rect.bottom + window.scrollY + 2;
    if (left + width > window.scrollX + window.innerWidth - 8) {
      left = window.scrollX + window.innerWidth - width - 8;
    }
    if (top + height > window.scrollY + window.innerHeight - 8 &&
        rect.top > height + 8) {
      top = rect.top + window.scrollY - height - 2;
    }
    popup.style.left = Math.max(window.scrollX + 8, left) + 'px';
    popup.style.top = Math.max(window.scrollY + 8, top) + 'px';
  };

  HtmlEditor.prototype._closePopup = function() {
    if (!this._popupElement) return;
    document.removeEventListener('pointerdown', this._onPopupPointerDown, true);
    document.removeEventListener('keydown', this._onPopupKeyDown);
    window.removeEventListener('resize', this._onPopupViewport);
    window.removeEventListener('scroll', this._onPopupViewport, true);
    if (this._popupTrigger) this._popupTrigger.setAttribute('aria-expanded', 'false');
    if (this._popupElement.parentNode) {
      this._popupElement.parentNode.removeChild(this._popupElement);
    }
    this._popupElement = null;
    this._popupTrigger = null;
    if (activeHtmlEditorPopup === this) activeHtmlEditorPopup = null;
  };

  HtmlEditor.prototype._insertTable = function(rows, columns) {
    var markup = '<table><tbody>';
    var row;
    var column;
    for (row = 0; row < rows; row += 1) {
      markup += '<tr>';
      for (column = 0; column < columns; column += 1) markup += '<td><br></td>';
      markup += '</tr>';
    }
    markup += '</tbody></table><p><br></p>';
    this._insertHtml(markup);
  };

  HtmlEditor.prototype._createDialogField = function(container, labelText, options) {
    var field = document.createElement('div');
    var label = document.createElement('label');
    var input = document.createElement('input');
    var control;
    field.className = 'fui-html-editor-dialog-field';
    label.textContent = labelText;
    input.type = options.type || 'text';
    input.id = 'fui-html-editor-field-' + htmlEditorFieldSequence;
    htmlEditorFieldSequence += 1;
    input.value = options.value || '';
    label.htmlFor = input.id;
    field.appendChild(label);
    field.appendChild(input);
    container.appendChild(field);
    if (input.type === 'file') {
      control = new FileBox(input, {
        buttonText: this._text('choosePicture'),
        accept: options.accept || '',
        theme: 'inherit'
      });
    } else {
      control = new EditBox(input, {
        editor: 'text',
        width: '100%',
        theme: 'inherit'
      });
    }
    this._dialog.controls.push(control);
    return { input: input, control: control };
  };

  HtmlEditor.prototype._createDialogCheck = function(container, labelText, checked) {
    var input = document.createElement('input');
    var control;
    input.type = 'checkbox';
    input.checked = checked === true;
    container.appendChild(input);
    control = new CheckBox(input, {
      label: labelText,
      checked: input.checked,
      theme: 'inherit'
    });
    this._dialog.controls.push(control);
    return { input: input, control: control };
  };

  HtmlEditor.prototype._openDialog = function(type) {
    var self = this;
    var host;
    var content;
    var actions;
    var submitHost;
    var cancelHost;
    var title;
    var submit;
    var cancel;
    var fields = {};
    var selectedText = '';
    var dialog;
    this._closePopup();
    this._saveSelection();
    this._destroyDialog();
    if (type === 'link' && typeof window.getSelection === 'function') {
      selectedText = window.getSelection().toString();
    }
    host = document.createElement('div');
    content = document.createElement('div');
    actions = document.createElement('div');
    host.className = 'fui-html-editor-dialog-host';
    content.className = 'fui-html-editor-dialog-content';
    actions.className = 'fui-html-editor-dialog-actions';
    host.appendChild(content);
    host.appendChild(actions);
    document.body.appendChild(host);
    title = this._text(type + 'Dialog');
    this._dialog = { host: host, controls: [], type: type, closing: false };
    dialog = this._dialog;
    if (type === 'link') {
      fields.text = this._createDialogField(content, this._text('linkText'), {
        value: selectedText
      });
      fields.url = this._createDialogField(content, this._text('linkUrl'), {});
      fields.newWindow = this._createDialogCheck(
        content,
        this._text('openNewWindow'),
        true
      );
    } else if (type === 'picture') {
      fields.url = this._createDialogField(content, this._text('pictureUrl'), {});
      fields.alt = this._createDialogField(content, this._text('pictureAlt'), {});
      fields.file = this._createDialogField(content, this._text('pictureFile'), {
        type: 'file',
        accept: 'image/*'
      });
    } else if (type === 'video') {
      fields.url = this._createDialogField(content, this._text('videoUrl'), {});
    } else {
      content.classList.add('fui-html-editor-help');
      this._text('helpContent').split('\n').forEach(function(line) {
        var paragraph = document.createElement('p');
        paragraph.textContent = line;
        content.appendChild(paragraph);
      });
    }
    cancelHost = document.createElement('a');
    cancelHost.href = 'javascript:void(0)';
    cancelHost.textContent = this._text('cancel');
    actions.appendChild(cancelHost);
    cancel = new Button(cancelHost, {
      text: this._text('cancel'),
      theme: 'inherit',
      onClick: function() {
        if (self._dialog) self._dialog.window.close();
        return false;
      }
    });
    this._dialog.controls.push(cancel);
    if (type !== 'help') {
      submitHost = document.createElement('a');
      submitHost.href = 'javascript:void(0)';
      submitHost.textContent = this._text('insert');
      actions.insertBefore(submitHost, cancelHost);
      submit = new Button(submitHost, {
        text: this._text('insert'),
        theme: 'inherit',
        onClick: function() {
          self._submitDialog(type, fields);
          return false;
        }
      });
      this._dialog.controls.push(submit);
    }
    this._dialog.window = new Window(host, {
      title: title,
      width: type === 'help' ? 480 : 460,
      height: type === 'picture' ? 390 : type === 'help' ? 340 : 300,
      minWidth: 320,
      minHeight: 220,
      modal: true,
      constrain: true,
      closed: true,
      maximizable: false,
      minimizable: false,
      collapsible: false,
      resizable: true,
      locale: this.options.locale,
      theme: 'inherit',
      onClose: function() {
        setTimeout(function() {
          if (self._dialog === dialog) self._destroyDialog();
        }, 0);
      }
    });
    this._dialog.window.open().center();
    this._fire('DialogOpen', { type: type });
    if (fields.url) {
      setTimeout(function() {
        if (!self._destroyed && self._dialog === dialog) fields.url.control.focus();
      }, 0);
    }
  };

  HtmlEditor.prototype._submitDialog = function(type, fields) {
    var self = this;
    var dialog = this._dialog;
    var url;
    var text;
    var markup;
    var file;
    if (type === 'link') {
      url = safeHtmlEditorUrl(fields.url.control.getValue(), 'link');
      if (!url) return this._dialogError(fields.url.input);
      text = fields.text.control.getValue() || url;
      markup = '<a href="' + escapeHtmlEditorText(url) + '"' +
        (fields.newWindow.input.checked ?
          ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        escapeHtmlEditorText(text) + '</a>';
      this._insertHtml(markup);
      this._dialog.window.close();
    } else if (type === 'picture') {
      file = fields.file.input.files && fields.file.input.files[0];
      if (file) {
        if (!/^image\//i.test(file.type)) return this._dialogError(fields.file.input);
        this._cancelImageRead();
        this._fileReader = new FileReader();
        this._fileReader.onload = function() {
          var reader = self._fileReader;
          if (!reader || self._destroyed || self._dialog !== dialog) return;
          self._fileReader = null;
          markup = '<img src="' + escapeHtmlEditorText(reader.result) + '" alt="' +
            escapeHtmlEditorText(fields.alt.control.getValue()) + '">';
          self._insertHtml(markup);
          self._fire('ImageUpload', { file: file, dataUrl: reader.result });
          if (self._dialog === dialog) dialog.window.close();
        };
        this._fileReader.onerror = function(error) {
          if (self._fileReader) self._fileReader = null;
          if (self._destroyed || self._dialog !== dialog) return;
          self._fire('Error', { command: 'picture', error: error });
        };
        this._fileReader.onabort = function() {
          if (self._fileReader) self._fileReader = null;
        };
        this._fileReader.readAsDataURL(file);
        return;
      }
      url = safeHtmlEditorUrl(fields.url.control.getValue(), 'image');
      if (!url) return this._dialogError(fields.url.input);
      markup = '<img src="' + escapeHtmlEditorText(url) + '" alt="' +
        escapeHtmlEditorText(fields.alt.control.getValue()) + '">';
      this._insertHtml(markup);
      this._dialog.window.close();
    } else if (type === 'video') {
      markup = htmlEditorVideoMarkup(fields.url.control.getValue());
      if (!markup) return this._dialogError(fields.url.input);
      this._insertHtml('<div class="fui-html-editor-media">' + markup + '</div><p><br></p>');
      this._dialog.window.close();
    }
  };

  HtmlEditor.prototype._cancelImageRead = function() {
    var reader = this._fileReader;
    this._fileReader = null;
    if (reader && reader.readyState === 1) reader.abort();
  };

  HtmlEditor.prototype._dialogError = function(input) {
    input.setCustomValidity(this._text('invalidUrl'));
    input.reportValidity();
    input.addEventListener('input', function clear() {
      input.setCustomValidity('');
      input.removeEventListener('input', clear);
    });
    return false;
  };

  HtmlEditor.prototype._destroyDialog = function() {
    var dialog = this._dialog;
    if (!dialog || dialog.closing) return;
    dialog.closing = true;
    this._cancelImageRead();
    this._dialog = null;
    if (dialog.window) dialog.window.dispose();
    dialog.controls.slice().reverse().forEach(function(control) {
      if (control && typeof control.dispose === 'function') control.dispose();
    });
    if (dialog.host.parentNode) dialog.host.parentNode.removeChild(dialog.host);
    this._fire('DialogClose', { type: dialog.type });
    if (!this._destroyed) this._restoreSelection();
  };

  HtmlEditor.prototype._filterCode = function(value) {
    var parser;
    var documentNode;
    var blocked;
    if ((!this.options.codeviewFilter && !this.options.codeviewIframeFilter) ||
        typeof DOMParser === 'undefined') {
      return String(value || '');
    }
    parser = new DOMParser();
    documentNode = parser.parseFromString(String(value || ''), 'text/html');
    if (this.options.codeviewFilter) {
      blocked = documentNode.body.querySelectorAll(
        'script, object, embed, link, meta, base, form'
      );
      Array.prototype.forEach.call(blocked, function(node) { node.remove(); });
      Array.prototype.forEach.call(documentNode.body.querySelectorAll('*'), function(node) {
        Array.prototype.slice.call(node.attributes).forEach(function(attribute) {
          if (/^on/i.test(attribute.name) ||
              (/^(?:href|src)$/i.test(attribute.name) &&
               /^\s*javascript:/i.test(attribute.value))) {
            node.removeAttribute(attribute.name);
          }
        });
      });
    }
    if (this.options.codeviewIframeFilter) {
      Array.prototype.forEach.call(documentNode.body.querySelectorAll('iframe'), function(frame) {
        var src = String(frame.getAttribute('src') || '');
        var valid = /^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/embed\//i
          .test(src) || /^https:\/\/player\.vimeo\.com\/video\//i.test(src);
        if (!valid) frame.remove();
      });
    }
    return documentNode.body.innerHTML;
  };

  HtmlEditor.prototype._syncSource = function(silent, reason) {
    var value = this.getValue();
    var changed = value !== this._lastValue;
    if (this._isTextarea) this.hostElement.value = value;
    else this.hostElement.innerHTML = value;
    this._lastValue = value;
    if (!silent && changed) {
      this._fire('Change', { value: value, reason: reason || 'api' });
      if (typeof Event === 'function') {
        this.hostElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  HtmlEditor.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var args = assignHtmlEditorOptions({ editor: this }, detail || {});
    var allowed = true;
    if (typeof callback === 'function' &&
        callback.call(this.hostElement, this, args) === false) {
      allowed = false;
    }
    listeners.forEach(function(listener) {
      if (listener.call(this, args) === false) allowed = false;
    }, this);
    return allowed;
  };

  HtmlEditor.prototype.on = function(name, handler) {
    name = String(name || '').toLowerCase();
    if (!name || typeof handler !== 'function') return this;
    (this._listeners[name] || (this._listeners[name] = [])).push(handler);
    return this;
  };

  HtmlEditor.prototype.off = function(name, handler) {
    var listeners;
    name = String(name || '').toLowerCase();
    listeners = this._listeners[name] || [];
    this._listeners[name] = handler ? listeners.filter(function(item) {
      return item !== handler;
    }) : [];
    return this;
  };

  HtmlEditor.prototype.getValue = function() {
    return this._codeView ? this.codeElement.value : this.editableElement.innerHTML;
  };

  HtmlEditor.prototype.setValue = function(value, silent) {
    value = String(value == null ? '' : value);
    this.editableElement.innerHTML = value;
    this.codeElement.value = value;
    this._syncSource(silent === true, 'api');
    return this;
  };

  HtmlEditor.prototype.code = function(value) {
    if (!arguments.length) return this.getValue();
    return this.setValue(value);
  };

  HtmlEditor.prototype.focus = function() {
    if (this._codeView) this.codeElement.focus();
    else this.editableElement.focus();
    return this;
  };

  HtmlEditor.prototype.toggleCodeView = function(force) {
    var enable = force == null ? !this._codeView : force === true;
    var filtered;
    var self = this;
    if (enable === this._codeView) return this;
    this._closePopup();
    if (enable) {
      this.codeElement.value = this.editableElement.innerHTML;
      this._codeView = true;
      [
        'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript'
      ].forEach(function(action) {
        if (self._actionControls[action]) self._actionControls[action].unselect(true);
      });
    } else {
      filtered = this._filterCode(this.codeElement.value);
      this.editableElement.innerHTML = filtered;
      this.codeElement.value = filtered;
      this._codeView = false;
      this._syncSource(false, 'codeview');
    }
    this.rootElement.classList.toggle('fui-html-editor-code-view', enable);
    this.editableElement.hidden = enable;
    this.codeElement.hidden = !enable;
    if (this._actionControls.codeview) {
      if (enable) this._actionControls.codeview.select(true);
      else this._actionControls.codeview.unselect(true);
    }
    this._applyState();
    this.focus();
    this._fire('CodeViewChange', { active: enable });
    return this;
  };

  HtmlEditor.prototype.isCodeView = function() {
    return this._codeView;
  };

  HtmlEditor.prototype.toggleFullscreen = function(force) {
    var enable = force == null ? !this._fullscreen : force === true;
    if (enable === this._fullscreen) return this;
    if (enable && activeFullscreenEditor && activeFullscreenEditor !== this) {
      activeFullscreenEditor.toggleFullscreen(false);
    }
    this._fullscreen = enable;
    this.rootElement.classList.toggle('fui-html-editor-fullscreen', enable);
    document.documentElement.classList.toggle('fui-html-editor-page-fullscreen', enable);
    document.body.classList.toggle('fui-html-editor-page-fullscreen', enable);
    if (enable) activeFullscreenEditor = this;
    else if (activeFullscreenEditor === this) activeFullscreenEditor = null;
    if (this._actionControls.fullscreen) {
      if (enable) this._actionControls.fullscreen.select(true);
      else this._actionControls.fullscreen.unselect(true);
    }
    this._fire('FullscreenChange', { active: enable });
    return this;
  };

  HtmlEditor.prototype.isFullscreen = function() {
    return this._fullscreen;
  };

  HtmlEditor.prototype._applyState = function() {
    var self = this;
    var editingDisabled = this.options.disabled || this.options.readOnly;
    this.rootElement.classList.toggle('fui-html-editor-disabled', this.options.disabled);
    this.rootElement.classList.toggle('fui-html-editor-readonly', this.options.readOnly);
    this.editableElement.contentEditable = editingDisabled ? 'false' : 'true';
    this.codeElement.disabled = this.options.disabled;
    this.codeElement.readOnly = this.options.readOnly;
    this.resizeElement.hidden = this.options.resizable === false;
    Object.keys(this._actionControls).forEach(function(action) {
      var control = self._actionControls[action];
      var alwaysAvailable = ['fullscreen', 'codeview', 'help'].indexOf(action) >= 0;
      var disabled = self.options.disabled ||
        ((self.options.readOnly || self._codeView) && !alwaysAvailable);
      if (disabled) control.disable();
      else control.enable();
    });
  };

  HtmlEditor.prototype.disable = function() {
    this.options.disabled = true;
    this._closePopup();
    this._applyState();
    return this;
  };

  HtmlEditor.prototype.enable = function() {
    this.options.disabled = false;
    this._applyState();
    return this;
  };

  HtmlEditor.prototype.setReadOnly = function(value) {
    this.options.readOnly = value !== false;
    this._closePopup();
    this._applyState();
    return this;
  };

  HtmlEditor.prototype.setLocale = function(locale, messages) {
    var self = this;
    this.options.locale = normalizeHtmlEditorLocale(locale);
    this.options.messages = messages || this.options.messages;
    this._messages = assignHtmlEditorOptions(
      {},
      HTML_EDITOR_LOCALES.en,
      HTML_EDITOR_LOCALES[this.options.locale],
      this.options.messages || {}
    );
    if (this.rootElement) {
      this.rootElement.lang = this.options.locale;
      this.rootElement.setAttribute('aria-label', this._text('ariaLabel'));
      this.resizeElement.setAttribute('aria-label', this._text('resize'));
      Object.keys(this._actionControls).forEach(function(action) {
        var definition = ACTION_LABELS[action];
        var host = self._actionControls[action].hostElement;
        host.title = self._text(definition[1]);
        host.setAttribute('aria-label', self._text(definition[1]));
      });
    }
    return this;
  };

  HtmlEditor.prototype.setTheme = function(theme) {
    this.options.theme = normalizeHtmlEditorTheme(theme);
    return this;
  };

  HtmlEditor.prototype.resize = function(size, silent) {
    var height;
    size = size || {};
    if (Object.prototype.hasOwnProperty.call(size, 'width')) {
      this.options.width = size.width;
      this.rootElement.style.width = htmlEditorCssSize(size.width);
    }
    if (Object.prototype.hasOwnProperty.call(size, 'height')) {
      height = Math.max(
        this.options.minHeight,
        Math.min(this.options.maxHeight, htmlEditorNumber(size.height, this.options.height))
      );
      this.options.height = height;
      this.editableElement.style.height = height + 'px';
      this.codeElement.style.height = height + 'px';
      this.resizeElement.setAttribute('aria-valuenow', String(Math.round(height)));
      this.resizeElement.setAttribute('aria-valuemin', String(this.options.minHeight));
      this.resizeElement.setAttribute('aria-valuemax', String(this.options.maxHeight));
    }
    if (!silent) this._fire('Resize', { width: this.options.width, height: this.options.height });
    return this;
  };

  HtmlEditor.prototype._startResize = function(event) {
    var self = this;
    if (event.button !== 0 || this.options.resizable === false || this._fullscreen) return;
    this._dragState = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: this.editableElement.getBoundingClientRect().height
    };
    this.rootElement.classList.add('fui-html-editor-resizing');
    this._onResizePointerMove = function(moveEvent) {
      if (!self._dragState || moveEvent.pointerId !== self._dragState.pointerId) return;
      self.resize({
        height: self._dragState.startHeight + moveEvent.clientY - self._dragState.startY
      }, true);
      moveEvent.preventDefault();
    };
    this._onResizePointerEnd = function(endEvent) {
      if (!self._dragState || endEvent.pointerId !== self._dragState.pointerId) return;
      document.removeEventListener('pointermove', self._onResizePointerMove);
      document.removeEventListener('pointerup', self._onResizePointerEnd);
      document.removeEventListener('pointercancel', self._onResizePointerEnd);
      self._dragState = null;
      self.rootElement.classList.remove('fui-html-editor-resizing');
      self._fire('Resize', {
        width: self.options.width,
        height: self.options.height,
        cancelled: endEvent.type === 'pointercancel'
      });
    };
    document.addEventListener('pointermove', this._onResizePointerMove);
    document.addEventListener('pointerup', this._onResizePointerEnd);
    document.addEventListener('pointercancel', this._onResizePointerEnd);
    event.preventDefault();
  };

  HtmlEditor.prototype.optionsValue = function() {
    return this.options;
  };

  HtmlEditor.prototype.setOptions = function(options) {
    options = options || {};
    assignHtmlEditorOptions(this.options, options);
    if (Object.prototype.hasOwnProperty.call(options, 'locale')) {
      this.setLocale(options.locale, options.messages);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'theme')) this.setTheme(options.theme);
    if (Object.prototype.hasOwnProperty.call(options, 'toolbar')) {
      this.options.toolbar = normalizeHtmlEditorToolbar(options.toolbar);
      this._buildToolbar();
    }
    if (Object.prototype.hasOwnProperty.call(options, 'placeholder')) {
      this.editableElement.setAttribute('data-placeholder', String(options.placeholder || ''));
    }
    if (Object.prototype.hasOwnProperty.call(options, 'value')) this.setValue(options.value);
    this.resize({
      width: Object.prototype.hasOwnProperty.call(options, 'width') ?
        options.width : this.options.width,
      height: Object.prototype.hasOwnProperty.call(options, 'height') ?
        options.height : this.options.height
    }, true);
    this._applyState();
    return this;
  };

  HtmlEditor.prototype.dispose = function() {
    var value;
    if (this._destroyed) return;
    value = this.getValue();
    this._destroyed = true;
    this._closePopup();
    this._cancelImageRead();
    this._destroyDialog();
    if (this._fullscreen) this.toggleFullscreen(false);
    if (this._dragState && this._onResizePointerEnd) {
      document.removeEventListener('pointermove', this._onResizePointerMove);
      document.removeEventListener('pointerup', this._onResizePointerEnd);
      document.removeEventListener('pointercancel', this._onResizePointerEnd);
      this._dragState = null;
    }
    this._toolbarControls.slice().reverse().forEach(function(control) {
      control.dispose();
    });
    this.removeEventListener();
    unregisterControl(this.rootElement, this);
    unregisterControl(this.hostElement, this);
    if (this.rootElement.parentNode) this.rootElement.parentNode.removeChild(this.rootElement);
    this.hostElement.__fabuiHtmlEditor = null;
    this.hostElement.hidden = this._original.hidden;
    restoreHtmlEditorAttribute(this.hostElement, 'class', this._original.className);
    restoreHtmlEditorAttribute(this.hostElement, 'style', this._original.style);
    restoreHtmlEditorAttribute(this.hostElement, 'aria-hidden', this._original.ariaHidden);
    if (this._isTextarea) this.hostElement.value = value;
    else this.hostElement.innerHTML = value;
    this._listeners = {};
  };

  HtmlEditor.prototype.destroy = HtmlEditor.prototype.dispose;

  HtmlEditor.defaults = {
    value: '',
    width: '100%',
    height: 300,
    minHeight: 120,
    maxHeight: 800,
    placeholder: '',
    focus: false,
    disabled: false,
    readOnly: false,
    resizable: true,
    spellcheck: true,
    locale: 'en',
    messages: null,
    theme: 'inherit',
    toolbar: DEFAULT_TOOLBAR,
    fontNames: [
      'Arial', 'Arial Black', 'Courier New', 'Georgia', 'Tahoma',
      'Times New Roman', 'Trebuchet MS', 'Verdana'
    ],
    fontSizes: [8, 10, 12, 14, 18, 24, 36],
    colors: [
      '#000000', '#424242', '#636363', '#9C9C94', '#CEC6CE', '#EFEFEF',
      '#F7F7F7', '#FFFFFF',
      '#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
      '#9C00FF', '#FF00FF',
      '#F7C6CE', '#FFE7CE', '#FFEFC6', '#D6EFD6', '#CEDEE7', '#CEE7F7',
      '#D6D6E7', '#E7D6DE',
      '#E79C9C', '#FFC69C', '#FFE79C', '#B5D6A5', '#A5C6CE', '#9CC6EF',
      '#B5A5D6', '#D6A5BD',
      '#E76363', '#F7AD6B', '#FFD663', '#94BD7B', '#73A5AD', '#6BADDE',
      '#8C7BC6', '#C67BA5',
      '#CE0000', '#E79439', '#EFC631', '#6BA54A', '#4A7B8C', '#3984C6',
      '#634AA5', '#A54A7B',
      '#9C0000', '#B56308', '#BD9400', '#397B21', '#104A5A', '#085294',
      '#311873', '#731842',
      '#630000', '#7B3900', '#846300', '#295218', '#083139', '#003163',
      '#21104A', '#4A1031'
    ],
    codeviewFilter: false,
    codeviewIframeFilter: true,
    onInit: null,
    onChange: null,
    onFocus: null,
    onBlur: null,
    onResize: null,
    onCodeViewChange: null,
    onFullscreenChange: null,
    onDialogOpen: null,
    onDialogClose: null,
    onImageUpload: null,
    onError: null
  };
  HtmlEditor.locales = HTML_EDITOR_LOCALES;
  HtmlEditor.themes = HTML_EDITOR_THEMES.slice();
  HtmlEditor.toolbar = normalizeHtmlEditorToolbar();
  HtmlEditor.normalizeLocale = normalizeHtmlEditorLocale;
  HtmlEditor.normalizeTheme = normalizeHtmlEditorTheme;
  HtmlEditor.getControl = function(element) {
    element = resolveHtmlEditorElement(element);
    return element && element.__fabuiHtmlEditor ? element.__fabuiHtmlEditor : null;
  };
  return HtmlEditor;
}
