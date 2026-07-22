# fabui.Form API

`fabui.Form` 是 FabUI core 內建的 pure JavaScript 表單控制器，API 參考 jQuery EasyUI Form。它不建立另一套欄位 renderer，而是管理既有 `<form>`、原生表單欄位及已建立的 FabUI `EditBox`、`CheckBox`、`CheckGroup`、`FileBox` 等控件。

主要能力包含 Ajax／一般表單送出、本機與遠端資料載入、clear、reset、HTML constraint validation、dirty-only submit、上傳進度、事件與 Control lifecycle。

## 建立 Form

Browser global：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<form id="contact-form" method="post" action="/api/contact">
  <input name="name" required>
  <input name="email" type="email" required>
  <button type="submit">Submit</button>
</form>
<script src="./dist/fabui.min.js"></script>
<script>
  var form = new fabui.Form('#contact-form', {
    ajax: true,
    success: function(data) {
      console.log(JSON.parse(data));
    }
  });
</script>
```

建構式必須傳入 `<form>` element 或 selector。相同 form 重複建立時會回傳既有 instance。

## Options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `novalidate` | `false` | `false` 時，送出前執行 HTML constraint validation。 |
| `iframe` | `true` | EasyUI 相容選項；FabUI 使用現代 XHR transport。設為 `true` 時不發出 upload progress。 |
| `ajax` | `true` | `true` 使用 XHR；`false` 使用瀏覽器原生 form submit，且不呼叫 `success`。 |
| `dirty` | `false` | `true` 時只送出相對 dirty 基準已變更的具名欄位。 |
| `queryParams` | `{}` | 每次送出時附加的參數；同名 submit options 優先。 |
| `url` | `null` | 送出 URL；未設定時使用 form `action`。 |
| `locale` | `'en'` | Validation tip 語系；內建 `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `'inherit'` | 相容用 theme metadata；validation tip 配色由外部 Theme CSS 決定。 |
| `onSubmit` | `null` | 送出前 callback，簽名為 `(params)`；可修改參數，回傳 `false` 取消。 |
| `onProgress` | `null` | `iframe: false` 時的 upload progress callback，簽名為 `(percent)`。 |
| `success` | `null` | Ajax 成功 callback，收到未解析的 response text。 |
| `onBeforeLoad` | `null` | 遠端載入前 callback，簽名為 `(params)`；回傳 `false` 取消。 |
| `onLoadSuccess` | `null` | 本機或遠端資料載入完成後觸發，簽名為 `(data)`。 |
| `onLoadError` | `null` | 遠端載入失敗或 JSON 無法解析時觸發。 |
| `onChange` | `null` | 欄位值改變時觸發，簽名為 `(target)`。 |

`method` 預設讀取 form `method`，未設定時使用 `GET`。`enctype`、原生欄位成功控制項規則與 `FileList` 由 `FormData` 保留。

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 回傳目前 options 副本。 |
| `setOptions(options)` | 更新 Form options。 |
| `submit(options?)` | 送出表單；回傳 Promise。驗證或 callback 取消時 resolve `false`。 |
| `load(dataOrUrl)` | object 直接載入；URL 以 GET 載入 JSON。 |
| `clear()` | 清除文字、選取、checkbox／radio 與檔案欄位。 |
| `reset()` | 還原原生預設值及 FabUI 控件初始值，並重設 validation／dirty。 |
| `validate()` | 驗證表單，回傳 boolean，並標記無效欄位。 |
| `enableValidation()` | 啟用送出前驗證。 |
| `disableValidation()` | 停用驗證並清除無效狀態。 |
| `resetValidation()` | 清除 Form 加入的 validation 標記，不改變欄位內容。 |
| `setLocale(locale)` | 切換 validation tip 語系；已顯示的提示立即更新。 |
| `setTheme(theme)` | 更新 Form 與 validation tip 的相容 theme 狀態，不切換 CSS。 |
| `resetDirty()` | 以目前欄位值建立新的 dirty 基準。 |
| `isDirty(name?)` | 判斷整份表單或指定 name 是否已變更。 |
| `getData()` | 依 `FormData` 規則回傳目前具名欄位；同名欄位回傳陣列。 |
| `on(type, listener)` / `off(type, listener?)` | 管理 FabUI 事件。 |
| `destroy()` / `dispose()` | 取消進行中 request、解除 listener、還原 form class／`novalidate` 並解除 registry。 |

### 載入資料

```js
form.load({
  name: '王小明',
  email: 'ming@example.com',
  gender: 'male',
  interests: ['grid', 'chart'],
  newsletter: true
});
```

`radio` 依 value 比對；同名 checkbox、multiple select、ComboBox 與 CheckGroup 接受陣列。單一 checkbox 可用 boolean。基於瀏覽器安全限制，`load()` 不會把非空檔名或 `FileList` 寫入 file input。

遠端載入：

```js
form.load('/api/contact/42').then(function(data) {
  console.log(data);
});
```

回應必須是 JSON object。載入成功後，Form 會呼叫 `resetDirty()`，因此新資料是後續 dirty tracking 的基準。

### Ajax submit

```js
form.submit({
  url: '/api/contact',
  method: 'POST',
  iframe: false,
  queryParams: {
    source: 'demo'
  },
  onSubmit: function(params) {
    params.locale = 'zh-TW';
    return this.validate();
  },
  onProgress: function(percent) {
    console.log(percent);
  },
  success: function(data) {
    console.log(JSON.parse(data));
  }
});
```

`success` 收到原始 response text，是否解析 JSON 由應用程式決定。HTTP 或網路失敗會 reject Promise，並發出 `submiterror` event。

### Dirty-only submit

```js
form.resetDirty();

form.submit({
  dirty: true
});
```

只有相對於最後一次 `resetDirty()`、成功 `load()` 或成功 Ajax submit 後已變更的具名欄位會送出；`queryParams` 仍會完整附加。

## Events

可取消事件呼叫 `event.preventDefault()`：

- `beforesubmit`：Ajax 或一般送出前；可取消。
- `beforeload`：遠端載入前；可取消。

狀態事件：

- `change`
- `validate`
- `submitcancel`
- `progress`
- `success`
- `submiterror`
- `loadsuccess`
- `loaderror`
- `dirtyreset`
- `refresh`

```js
form.on('change', function(event) {
  console.log(event.detail.name, form.isDirty());
});

form.on('submiterror', function(event) {
  console.error(event.detail.status);
});
```

## Validation

Form 使用瀏覽器 HTML constraint validation API，支援 `required`、`type="email"`、`pattern`、`min`、`max`、`minlength`、`maxlength` 與 `setCustomValidity()`。為避免瀏覽器原生泡泡與 FabUI 樣式衝突，Form 以 `novalidate` 抑制原生 submit UI，再由 `validate()` 統一標記 `aria-invalid` 與 `.fui-form-invalid`。

已建立的 `fabui.EditBox` 會驗證其可見 textbox；invalid 狀態只套用在實際控制框，不包含 label。提示依 `locale` 與 `ValidityState` 顯示，不依賴瀏覽器介面語言；配色由外部 Theme CSS 決定。

內建訊息涵蓋必填、Email／URL 型別、pattern、長度、min／max、step 與 bad input。`setCustomValidity(message)` 的自訂訊息會保留呼叫端提供的原文。

Validation tip 支援 `Escape` 與點擊欄位外部關閉，並在 resize／scroll 時重新定位。document／window listener 只在提示顯示期間綁定，`resetValidation()`、欄位恢復有效或 `dispose()` 時立即解除。

其他控件沿用原生 input 的 constraint 與表單語意。

## Lifecycle 與 Control registry

```js
fabui.Control.getControl('#contact-form') === form;

form.dispose();

fabui.Control.getControl('#contact-form') === null;
```

`dispose()` 不會刪除欄位或改變表單值，只移除 Form 自己加入的狀態、事件與 registry。
