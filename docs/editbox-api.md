# EditBox API

`fabui.EditBox` 是獨立的 pure JavaScript 編輯控件，以單一 class 取代原本分散的 TextBox、NumberBox、DateBox、ComboBox 公開入口。四種模式共用 TextBox 視覺基準與同一組 FabGrid editor definitions，但不會併入 FabGrid core bundle。

## 載入方式

Browser global：

```html
<link rel="stylesheet" href="./dist/editbox.css">
<input id="amount">
<script src="./dist/editbox.min.js"></script>
<script>
  var amount = new fabui.EditBox('#amount', {
    editor: 'numberbox',
    precision: 2
  });
</script>
```

ES module：

```js
import EditBox from './dist/editbox.esm.js';

var editBox = new EditBox('#name', {
  editor: 'textbox',
  clearButton: true
});
```

Source mode：

```js
import EditBox from './src/editbox/editbox.js';
```

## Editor 類型

`editor` 可設定：

- `textbox`：文字或多行文字。
- `numberbox`：數字、最小值／最大值、精度、前後綴與千分位。
- `datebox`：日期；`mask: '9999/99'` 或 `'9999-99'` 時自動使用年月選擇模式。
- `combobox`：本機或遠端選項、單選或多選。

未設定 `editor` 時，`select` 自動使用 `combobox`，`input[type="number"]` 使用 `numberbox`，`input[type="date"]`／`input[type="month"]` 使用 `datebox`，其餘使用 `textbox`。

## 共用 methods

- `getEditorType()`：取得目前 editor 類型。
- `getDefinition(name?)`：取得目前或指定類型的共用 editor definition。
- `options()`、`textbox()`、`button()`、`getIcon(index)`。
- `getText()`、`setText(value)`。
- `getValue()`、`setValue(value, silent?)`、`initValue(value)`。
- `clear()`、`reset()`、`focus()`、`resize(width, height)`。
- `disable()`、`enable()`、`readonly(mode)`、`setEditable(mode)`。
- `on(name, listener)`、`off(name, listener)`。
- `destroy()`／`dispose()`。

除 getter 與 `destroy()` 外，共用 methods 皆回傳 EditBox instance，可串接呼叫。

## 類型專用 methods

- NumberBox：`getNumber()`、`fix()`。
- DateBox：`getDate()`、`setDate(date)`、`calendar()`、`panel()`、`showPanel()`、`hidePanel()`、`togglePanel()`、`cloneFrom(from)`、`fix()`。
- ComboBox：`getData()`、`loadData(data)`、`reload()`、`getValues()`、`setValues(values)`、`select(value)`、`unselect(value)`、`scrollTo(value)`、`panel()`、`showPanel()`、`hidePanel()`、`togglePanel()`。

## 靜態 API

- `EditBox.editorTypes`：目前公開的四種 editor 類型。
- `EditBox.editorDefinitions`：與 FabGrid 共用的完整 editor definitions。
- `EditBox.getEditorDefinition(name)`：依名稱取得 definition。
- `EditBox.getControl(elementOrSelector)`：由原始 input／textarea／select 取得 EditBox instance；找不到時回傳 `null`。

API 命名以 EasyUI TextBox 的共用 value、state、event methods 為基準，DateBox 與 ComboBox 只補最常用的 panel、calendar、data 與 selection methods，不追求完整 EasyUI plugin 相容層。

## Demo

- [Source-mode 開發版](../demo/dev-editbox.html)
- [獨立 build-mode 正式版](../demo/editbox.html)
