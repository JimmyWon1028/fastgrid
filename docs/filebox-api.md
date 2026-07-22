# fabui.FileBox API

`fabui.FileBox` 是 FabUI core 內建的 pure JavaScript 檔案選擇控件，API 與視覺參考 jQuery EasyUI FileBox／Default theme。控件直接組合既有 `fabui.EditBox` 文字框外觀與原生 `<input type="file">`，不依賴 jQuery 或 EasyUI runtime。

原生 file input 會保留 `name`、`accept`、`multiple`、`capture`、`required`、`disabled`、`FileList`、表單送出與 form reset 語意。顯示用文字框不具 `name`，不會產生重複表單欄位。

## 建立控件

Browser global：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<input id="attachment" type="file" name="attachment">
<script src="./dist/fabui.min.js"></script>
<script>
  var fileBox = new fabui.FileBox('#attachment', {
    label: '附件：',
    prompt: '請選擇檔案…'
  });
</script>
```

建構式必須傳入已附加至文件的 `<input type="file">`。相同 input 重複建立時會回傳原 instance。

## Options

FileBox 沿用 EditBox 的尺寸、label、按鈕與狀態概念，並加入檔案選擇設定。

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `width` | `200` | 控件寬度；接受 number 或 CSS 尺寸字串。 |
| `height` | `30` | 控件高度。 |
| `cls` | `''` | 控件外層自訂 class。 |
| `prompt` | `''` | 尚未選檔時的提示文字。 |
| `label` | `''` | 控件標籤。 |
| `labelWidth` | `80` | 標籤寬度。 |
| `labelPosition` | `before` | `before`、`after`、`top`。 |
| `labelAlign` | `left` | `left`、`center`、`right`。 |
| `buttonText` | `Choose File` | 選擇檔案按鈕文字；未自訂時可隨 locale 切換。 |
| `buttonIcon` | `null` | 按鈕 `iconCls`。 |
| `buttonAlign` | `right` | 按鈕位於 `left` 或 `right`。 |
| `accept` | `''` | 同步原生 input 的 `accept`。 |
| `multiple` | `false` | 是否允許選取多個檔案。 |
| `separator` | `,` | 多檔檔名的顯示分隔字元。 |
| `capture` | `null` | 同步原生 input 的 `capture`。 |
| `disabled` | `false` | 停用控件與原生 input。 |
| `readonly` | `false` | 禁止開啟檔案選擇器，但保留既有選取。 |
| `required` | `false` | 同步原生 input 的 `required`。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `inherit` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `ariaLabel` | `''` | 顯示文字框的輔助名稱。 |
| `onChange` | `null` | 選取變更 callback，簽名為 `(newValue, oldValue)`。 |
| `onResize` | `null` | 尺寸變更 callback，簽名為 `(width, height)`。 |
| `onClickButton` | `null` | 點擊選檔按鈕時觸發。 |

HTML attribute 可提供 `accept`、`multiple`、`capture`、`required`、`disabled`、`placeholder`、`label`、`labelPosition`、`buttonText` 與 `buttonAlign`；JavaScript options 優先。

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 回傳目前 options 的淺層副本。 |
| `setOptions(options)` | 更新尺寸、label、按鈕、檔案條件、狀態、locale 或 theme。 |
| `textbox()` | 回傳顯示檔名的唯讀 input。 |
| `button()` | 回傳選擇檔案按鈕。 |
| `files()` | 回傳原生 `FileList`。 |
| `getValue()` | 回傳目前顯示的檔名；多檔以 `separator` 串接。 |
| `setValue(value)` | 只接受空字串或 `null` 以清空；非空值會拋錯。 |
| `clear()` | 清除原生 FileList 與顯示檔名。 |
| `reset()` | 清除目前選取。 |
| `focus()` | 聚焦顯示文字框。 |
| `resize(width, height)` | 調整控件尺寸。 |
| `disable()` / `enable()` | 切換停用狀態。 |
| `readonly(mode)` | 切換唯讀狀態。 |
| `setLocale(locale, messages?)` | 切換或註冊語系文字。 |
| `setTheme(theme)` | 更新相容 theme 狀態，不載入或切換 CSS。 |
| `on(type, listener)` / `off(type, listener?)` | 管理 FabUI 事件。 |
| `destroy()` / `dispose()` | 移除控件並還原原始 input。 |

### 瀏覽器安全限制

瀏覽器禁止 JavaScript 把本機路徑或 FileList 寫入 file input，因此 FileBox 不提供指定非空檔案值的能力：

```js
fileBox.setValue('report.pdf'); // Throws.
fileBox.setValue('');           // Clears the selection.
```

需要檔案內容時應使用：

```js
Array.from(fileBox.files()).forEach(function(file) {
  console.log(file.name, file.size, file.type);
});
```

## Events

使用 callback：

```js
var fileBox = new fabui.FileBox('#files', {
  multiple: true,
  onChange: function(newValue, oldValue) {
    console.log(newValue, oldValue, this.files());
  }
});
```

使用 event emitter：

```js
fileBox.on('change', function(event) {
  console.log(event.detail.value);
  console.log(event.detail.files);
});
```

事件包含：

- `change`：原生選檔或 `clear()` 改變選取後觸發。
- `buttonClick`：點擊選檔按鈕時觸發。
- `resize`：尺寸變更後觸發。
- `refresh`：`setOptions()` 套用後觸發。

## Lifecycle 與 Control registry

```js
fabui.Control.getControl('#attachment') === fileBox;

fileBox.dispose();

fabui.Control.getControl('#attachment') === null;
```

`dispose()` 會解除所有 managed listeners、移除 EditBox 顯示層，並還原原生 input 的 class、style、id、檔案條件、狀態與 ARIA attributes。
