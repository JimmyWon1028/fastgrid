(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono', 'mono-red', 'mono-green'
  ];

  function mountFormDemo(fabui) {
    var themeSelect = document.getElementById('form-theme');
    var status = document.getElementById('form-status');
    var host = document.getElementById('contact-form');
    var controls = [];
    var form;

    function log(message, isError) {
      status.textContent = message;
      status.classList.toggle('demo-error', Boolean(isError));
    }

    function createEditBox(selector, options) {
      var control = new fabui.EditBox(selector, options);
      controls.push(control);
      return control;
    }

    function createButton(selector, options) {
      var control = new fabui.Button(selector, options);
      controls.push(control);
      return control;
    }

    function applyTheme(theme) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + theme);
      controls.forEach(function(control) {
        if (control instanceof fabui.EditBox) return;
        if (typeof control.setTheme === 'function') control.setTheme('inherit');
      });
      if (form && typeof form.setTheme === 'function') form.setTheme('inherit');
    }

    if (!fabui || typeof fabui.Form !== 'function') {
      throw new Error('fabui.Form class is unavailable.');
    }

    createEditBox('#form-name', {
      width: '100%',
      label: 'Name:',
      labelPosition: 'top',
      required: true
    });
    createEditBox('#form-email', {
      width: '100%',
      label: 'Email:',
      labelPosition: 'top',
      required: true
    });
    createEditBox('#form-subject', {
      width: '100%',
      label: 'Subject:',
      labelPosition: 'top'
    });
    createEditBox('#form-message', {
      width: '100%',
      height: 76,
      label: 'Message:',
      labelPosition: 'top',
      multiline: true
    });
    controls.push(new fabui.CheckBox('#form-newsletter', {
      label: '訂閱產品更新',
      labelPosition: 'after'
    }));

    form = new fabui.Form(host, {
      url: './data/form-submit.json',
      ajax: true,
      dirty: false,
      locale: 'zh-TW',
      queryParams: {
        source: 'fabui-form-demo'
      },
      onSubmit: function(params) {
        params.locale = 'zh-TW';
        log('正在驗證並送出表單…');
      },
      onProgress: function(percent) {
        log('上傳進度：' + percent + '%');
      },
      success: function(data) {
        var result = JSON.parse(data);
        log(result.message + '（dirty: ' + form.isDirty() + '）');
      },
      onLoadSuccess: function() {
        log('表單資料載入完成。');
      },
      onLoadError: function() {
        log('表單資料載入失敗。', true);
      },
      onChange: function(target) {
        log('欄位已變更：' + target.name + '；dirty: ' + form.isDirty());
      }
    });

    createButton('#form-load-local', {
      text: 'Load Local',
      iconCls: 'icon-edit',
      onClick: function() {
        form.load({
          name: 'Local Record',
          email: 'local@example.com',
          subject: 'Local Object',
          message: '這筆資料由 JavaScript object 載入。',
          language: 'en',
          newsletter: false
        });
      }
    });
    createButton('#form-load-remote', {
      text: 'Load Remote',
      iconCls: 'icon-reload',
      onClick: function() {
        form.load('./data/form-load.json').catch(function(error) {
          log(error.message, true);
        });
      }
    });
    createButton('#form-clear', {
      text: 'Clear',
      iconCls: 'icon-clear',
      onClick: function() {
        form.clear();
        log('表單已清除；dirty: ' + form.isDirty());
      }
    });
    createButton('#form-reset', {
      text: 'Reset',
      iconCls: 'icon-undo',
      onClick: function() {
        form.reset();
        log('表單已重設；dirty: ' + form.isDirty());
      }
    });
    createButton('#form-submit', {
      text: 'Submit',
      iconCls: 'icon-ok',
      onClick: function() {
        form.submit();
      }
    });
    createButton('#form-validation', {
      text: 'Disable Validation',
      iconCls: 'icon-lock',
      onClick: function(button) {
        if (form.options().novalidate) {
          form.enableValidation();
          button.setText('Disable Validation');
          log('表單驗證已啟用。');
        } else {
          form.disableValidation();
          button.setText('Enable Validation');
          log('表單驗證已停用。');
        }
      }
    });
    createButton('#form-reset-dirty', {
      text: 'Reset Dirty',
      iconCls: 'icon-save',
      onClick: function() {
        form.resetDirty();
        log('目前欄位值已設為新的 dirty 基準。');
      }
    });

    themeSelect.addEventListener('change', function() {
      applyTheme(themeSelect.value);
      log('Theme：' + themeSelect.value);
    });

    form.on('submiterror', function(event) {
      log('送出失敗：HTTP ' + event.detail.status, true);
    });
    applyTheme('default');
    global.fabFormDemo = {
      form: form,
      controls: controls
    };
    log('fabui.Form Demo 已就緒。');
  }

  global.mountFabUIFormDemo = mountFormDemo;
}(typeof window !== 'undefined' ? window : this));
