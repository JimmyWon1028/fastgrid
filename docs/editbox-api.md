# EditBox API

`fabui.EditBox` 是獨立的 pure JavaScript 編輯控件，以單一 class 取代原本分散的 TextBox、NumberBox、DateBox、ComboBox 公開入口。`text`、`number`、`date`、`combo`、`color` 五種模式共用 TextBox 視覺基準與同一組 FabGrid editor definitions，但不會併入 FabGrid core bundle。

## 載入方式

Browser global：

```html
<link rel="stylesheet" href="./dist/editbox.css">
<input id="amount">
<script src="./dist/editbox.min.js"></script>
<script>
  var amount = new fabui.EditBox('#amount', {
    editor: 'number',
    precision: 2
  });
</script>
```

ES module：

```js
import EditBox from './dist/editbox.esm.js';

var editBox = new EditBox('#name', {
  editor: 'text',
  clearButton: true
});
```

Source mode：

```js
import EditBox from './src/editbox/editbox.js';
```

## Editor 類型

`editor` 可設定：

- `text`：文字或多行文字。
- `number`：數字、最小值／最大值、精度、前後綴與千分位。
- `date`：日期；`mask: '9999/99'` 或 `'9999-99'` 時自動使用年月選擇模式。
- `combo`：本機或遠端選項、單選或多選。
- `color`：文字輸入支援 hex 與標準 CSS 顏色名稱；右側色塊按鈕開啟常用色盤，CSS 色名會保留原始文字。

未設定 `editor` 時，`select` 自動使用 `combo`，`input[type="number"]` 使用 `number`，`input[type="date"]`／`input[type="month"]` 使用 `date`，`input[type="color"]` 使用 `color`，其餘使用 `text`。

舊名稱保留為相容別名：

- `textbox` → `text`
- `numberbox`、`numeric` → `number`
- `datebox`、`calendar` → `date`
- `combobox`、`select`、`dropdown` → `combo`
- `colour`、`colorbox`、`colourbox` → `color`

所有模式都可使用 `icons`。Icon descriptor 支援 `iconCls`／`className`／`iconClass`／`icon`、`width`、`text`、`title`、`ariaLabel`，以及 `onClick`／`click`／`handler`。

Color popup 的預設樣式與 FabGrid editor 一致，包含 60 色 palette、飽和度／明度、色相與透明度控制。`palette` 可自訂色票，`colors` 保留為相容別名；`showAlpha: false` 可隱藏透明度控制並固定輸出六碼 hex。

DateBox 的 `autoUnmask` 預設為 `true`。複製日期或年月時會移除遮罩字面值，例如 `2026/07/17` 複製為 `20260717`、`2026/07` 複製為 `202607`；明確設定 `autoUnmask: false` 可保留遮罩。

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
- Color：`panel()`、`showPanel()`、`hidePanel()`、`togglePanel()`；支援 `palette`／`colors` 與 `showAlpha`。

## 靜態 API

- `EditBox.editorTypes`：目前公開的五種 editor 類型。
- `EditBox.editorDefinitions`：與 FabGrid 共用的完整 editor definitions。
- `EditBox.getEditorDefinition(name)`：依名稱取得 definition。
- `EditBox.getControl(elementOrSelector)`：由原始 input／textarea／select 取得 EditBox instance；找不到時回傳 `null`。

API 命名以 EasyUI TextBox 的共用 value、state、event methods 為基準，DateBox 與 ComboBox 只補最常用的 panel、calendar、data 與 selection methods，不追求完整 EasyUI plugin 相容層。

## Demo

- [Source-mode 開發版](../demo/dev-editbox.html)
- [獨立 build-mode 正式版](../demo/editbox.html)
