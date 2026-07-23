(function(global) {
  'use strict';

  function mountHtmlEditorDemo(fabui) {
    var locale = document.getElementById('htmleditor-locale');
    var status = document.getElementById('htmleditor-status');
    var output = document.getElementById('htmleditor-output');
    var editor;
    var readOnly = false;

    function setStatus(text) {
      status.textContent = text;
    }

    if (!fabui || typeof fabui.HtmlEditor !== 'function') {
      throw new Error(
        'fabui.HtmlEditor is unavailable. Load fabui.* before fabui.htmleditor.*.'
      );
    }

    editor = new fabui.HtmlEditor('#html-content', {
      height: 360,
      minHeight: 180,
      maxHeight: 720,
      locale: locale.value,
      placeholder: '請在這裡輸入內容…',
      codeviewFilter: true,
      onChange: function(sender, args) {
        setStatus('內容已更新：' + args.value.length + ' 個字元');
      },
      onImageUpload: function(sender, args) {
        setStatus('已插入圖片：' + args.file.name);
      },
      onFullscreenChange: function(sender, args) {
        setStatus(args.active ? '已進入全螢幕' : '已離開全螢幕');
      }
    });

    locale.addEventListener('change', function() {
      editor.setLocale(locale.value);
      setStatus('語系：' + locale.value);
    });
    document.getElementById('show-html').addEventListener('click', function() {
      output.textContent = editor.getValue();
      setStatus('已取得目前 HTML');
    });
    document.getElementById('set-html').addEventListener('click', function() {
      editor.setValue(
        '<h2>FabUI HtmlEditor</h2>' +
        '<p>這是由 <strong>pure JavaScript</strong> 建立的獨立附加元件。</p>' +
        '<ul><li>Summernote 風格工具列</li><li>三語系與 19 組主題</li></ul>'
      );
      setStatus('已載入範例 HTML');
    });
    document.getElementById('toggle-readonly').addEventListener('click', function() {
      readOnly = !readOnly;
      editor.setReadOnly(readOnly);
      setStatus(readOnly ? '已切換為唯讀' : '已恢復編輯');
    });
    document.getElementById('clear-html').addEventListener('click', function() {
      editor.setValue('');
      output.textContent = '';
      setStatus('內容已清除');
    });

    global.fabHtmlEditorDemo = editor;
    setStatus('HtmlEditor Demo 已就緒');
  }

  global.mountFabUIHtmlEditorDemo = mountHtmlEditorDemo;
}(typeof window !== 'undefined' ? window : this));
