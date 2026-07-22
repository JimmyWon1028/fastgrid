# fabui.EditBox API

`fabui.EditBox` 是 FabUI core 內建的 pure JavaScript 編輯控件，以單一 class 取代原本分散的 TextBox、NumberBox、TimeBox、DateBox、ComboBox 公開入口。`text`、`number`、`time`、`date`、`combo`、`color` 六種模式共用 TextBox 視覺基準與同一組 FabGrid editor definitions。

EditBox 隨 `dist/fabui.*` 主 bundle 發佈，不需要也不再產生獨立的 `dist/editbox.*` 檔案。

Date EditBox 與 FabGrid 的日期 editor／Search Row 共用同一個內部 DatePopup。Calendar DOM、月份選單、鍵盤導覽、`Escape`、點擊外部關閉與 `.fui-calendar-*` 樣式皆以 EditBox 視覺為基準；DatePopup 不另外公開為 `fabui` API。Calendar 的 theme 色彩契約取自 `res/themes/*/calendar.css`，但 source、Demo 與 build 不依賴 `res/`。

Combo EditBox 與 FabGrid 的清單 editor／Search Row 共用同一個內部 ComboPopup。Option、group、active／selected 狀態、鍵盤導覽、寬度量測、`Escape`、點擊外部關閉與 `.fui-combobox-*` 樣式皆以 EditBox 視覺為基準；ComboPopup 不另外公開為 `fabui` API。資料載入、local／remote 過濾、多選與 Grid 值提交仍由各自的 editor adapter 管理。

Color EditBox 與 FabGrid 的顏色 editor／Search Row 也共用同一個內部 ColorPopup。色票、HSV、Alpha、pointer drag、`Escape`、點擊外部關閉與 `.fui-colorbox-*` 樣式皆以 EditBox 視覺為基準；ColorPopup 不另外公開為 `fabui` API。

## 載入方式

Browser global：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<input id="amount">
<script src="./dist/fabui.min.js"></script>
<script>
  var amount = new fabui.EditBox('#amount', {
    editor: 'number',
    precision: 2
  });
</script>
```

Source mode：

```js
import fabui from './src/fabui.js';

var editBox = new fabui.EditBox('#name', {
  editor: 'text'
});
```

## Editor 類型

`editor` 可設定：

- `text`：文字或多行文字。
- `number`：數字、最小值／最大值、精度、前後綴、千分位與可選的左右 Spinner。
- `time`：`99:99` 或 `99:99:99` 時間遮罩、標準 24 小時驗證與依游標段落調整的 Spinner。
- `date`：日期；`mask: '9999/99'` 或 `'9999-99'` 時自動使用年月選擇模式。
- `combo`：本機或遠端選項、單選或多選。
- `color`：文字輸入支援 hex 與標準 CSS 顏色名稱；右側色塊按鈕開啟常用色盤，CSS 色名會保留原始文字。

未設定 `editor` 時，`select` 自動使用 `combo`，`input[type="number"]` 使用 `number`，`input[type="date"]`／`input[type="month"]` 使用 `date`，`input[type="color"]` 使用 `color`，其餘使用 `text`。時間模式請明確設定 `editor: 'time'`。

舊名稱保留為相容別名：

- `textbox` → `text`
- `numberbox`、`numeric` → `number`
- `timebox` → `time`
- `datebox`、`calendar` → `date`
- `combobox`、`select`、`dropdown` → `combo`
- `colour`、`colorbox`、`colourbox` → `color`

所有模式都可使用 `icons`，而且與 FabGrid cell editor、Search Row 使用同一套 icon descriptor 語法：

```js
icons: [{
  iconCls: 'icon-refwin',
  title: '選擇參照',
  ariaLabel: '選擇參照',
  text: '',
  width: 28,
  align: 'right',
  keepFocus: true,
  onClick: function(args) {
    // Handle the icon click.
  }
}]
```

公開標準欄位為 `iconCls`、`title`、`ariaLabel`、`text`、`width`、`align`、`keepFocus` 與 `onClick`。`align` 預設為 `right`；EditBox 可用 `left` 將 icon 放到輸入框左側，FabGrid cell editor 與 Search Row 維持右側排列。舊 `className`／`iconClass`／`icon`、`label`、`click`／`handler` 只保留為相容別名，內部會先轉成標準欄位。

Color popup 與 FabGrid editor 共用同一個內部 ColorPopup，包含 60 色 palette、飽和度／明度、色相與透明度控制。`palette` 可自訂色票，`colors` 保留為相容別名；`showAlpha: false` 可隱藏透明度控制並固定輸出六碼 hex。自訂色票若使用標準 CSS 顏色名稱，選取後會保留原始名稱，不會強制轉成 hex。

DateBox 的 `autoUnmask` 預設為 `true`。複製日期或年月時會移除遮罩字面值，例如 `2026/07/17` 複製為 `20260717`、`2026/07` 複製為 `202607`；明確設定 `autoUnmask: false` 可保留遮罩。

## 共用 options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `editor` | 自動判斷 | `text`、`number`、`time`、`date`、`combo`、`color` 或相容別名。 |
| `width` | `200` | 控件寬度；接受 number 或 CSS 尺寸字串。 |
| `height` | `30` | 控件高度；接受 number 或 CSS 尺寸字串。 |
| `value` | 原 element 值 | 初始值。 |
| `prompt` | element placeholder | 輸入提示文字。 |
| `cls` | `''` | 加在控件外層的自訂 class。 |
| `label` | `''` | 控件標籤。 |
| `labelWidth` | `80` | 標籤寬度。 |
| `labelPosition` | `before` | `before`、`after`、`top`。 |
| `labelAlign` | `left` | `left`、`center`、`right`。 |
| `multiline` | `false` | 使用多行輸入。 |
| `editable` | `true` | 是否允許鍵盤輸入；設為 `false` 仍可由 API 或下拉 panel 選值。 |
| `disabled` | `false` | 停用控件。 |
| `readonly` | `false` | 唯讀狀態。 |
| `required` | `false` | 同步原始 element 的 required 狀態。 |
| `icons` | `[]` | Icon descriptor 陣列。 |
| `iconWidth` | `18` | 一般 icon 寬度；number／time Spinner、date、combo、color 預設使用 `28`。 |
| `buttonText` / `buttonIcon` | `''` | 輸入框旁的按鈕文字與 icon class。 |
| `buttonAlign` | `right` | 按鈕位置：`left` 或 `right`。 |
| `clearButton` | `false` | 顯示清除按鈕。 |
| `onChange` | `null` | 值改變 callback。 |
| `onResize` | `null` | 尺寸改變 callback。 |
| `onClickIcon` | `null` | 點擊 icon callback。 |
| `onClickButton` | `null` | 點擊按鈕 callback。 |

### Number options

數字模式的輸入文字預設靠右。

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `min` / `max` | `null` | 最小值與最大值。 |
| `precision` | `null` | 小數位數；有效範圍為 0 至 20。 |
| `thousandsSeparator` | `false` | 使用千分位；`useThousandsSeparator`、`showThousandsSeparator` 為相容別名。 |
| `decimalSeparator` | `.` | 小數點字元。 |
| `groupSeparator` | `''` | 群組分隔字元；啟用千分位且未指定時使用逗號。 |
| `prefix` / `suffix` | `''` | 顯示於數字前後的文字。 |
| `parser` / `formatter` | `null` | 自訂值解析與顯示格式化 function。 |
| `filter` | `null` | 鍵盤字元過濾 function；回傳 `false` 阻止輸入。 |
| `spinner` | `false` | `true` 或 `'right'` 在右側顯示上下箭頭；`'left'` 顯示於左側。 |
| `increment` | `1` | 每次點擊 Spinner 或按 `ArrowUp`／`ArrowDown` 時增減的數值。 |
| `locale` | `en` | Spinner 的 title 與 ARIA 文字語系：`en`、`zh-TW`、`zh-CN`。 |

以上 Spinner options 同時適用於 FabGrid 的 number cell editor，例如 `editor: { type: 'number', spinner: true, increment: 1 }`。FabGrid Search Row 不顯示 Spinner。

```js
var quantity = new fabui.EditBox('#quantity', {
  editor: 'number',
  spinner: 'right',
  increment: 1,
  min: 0,
  max: 100
});

var offset = new fabui.EditBox('#offset', {
  editor: 'number',
  spinner: 'left'
});
```

### Time options

Time EditBox 的輸入文字預設靠左，只接受數字輸入並會自動補上冒號。時為 `00`–`23`，分與秒為 `00`–`59`；只有完整的 `24:00` 或 `24:00:00` 可作為上限。輸入不完整、`24:00` 以外的 24 時段或其他超出範圍內容時，原始 input 與顯示輸入框都會進入 invalid 狀態。

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `mask` | `99:99` | 可設為 `99:99` 或 `99:99:99`。 |
| `autoUnmask` | `true` | `getValue()` 與複製內容移除冒號；設為 `false` 時保留遮罩。 |
| `spinner` | `false` | `true` 或 `'right'` 在右側顯示上下箭頭；`'left'` 顯示於左側。 |
| `iconWidth` | `28` | Spinner 寬度。 |
| `locale` | `en` | Spinner ARIA 與 invalid 訊息語系：`en`、`zh-TW`、`zh-CN`。 |

Spinner 點擊或按 `ArrowUp`／`ArrowDown` 時，會依游標目前所在的時、分或秒段落增減；每段不超過自身合法範圍，調到 24 時會自動成為完整上限。

```js
var startTime = new fabui.EditBox('#start-time', {
  editor: 'time',
  mask: '99:99:99',
  spinner: true
});
```

### Date options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `mask` | `9999/99/99` | 日期遮罩；`9999/99`、`9999-99` 自動切換為年份／月份選擇 popup。 |
| `autoUnmask` | `true` | 複製時移除遮罩字面值。 |
| `maskValueIncludesLiterals` | `null` | 明確控制資料值是否保留 `/`、`-` 等遮罩字元。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `firstDay` | `0` | 每週第一天，`0` 代表星期日。 |
| `showWeek` | `false` | 顯示週次。 |
| `showLunar` | `false` | 在國曆日期下方顯示農曆日期；初一會包含月份，例如 `六月 初一`。 |
| `theme` | `inherit` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `weekNumberHeader` | `''` | 週次欄標題。 |
| `panelWidth` / `panelHeight` | `250` / `auto` | Popup 尺寸。 |
| `formatter` / `parser` | 內建 | Date 與文字的轉換 function。 |
| `validator` | `null` | 判斷日期是否可選的 function。 |
| `buttons` | `null` | 自訂 popup 底部按鈕。 |
| `sharedCalendar` | `null` | 與其他 date EditBox 共用 calendar 的容器 element 或 selector。 |
| `weeks` / `months` | locale | 自訂星期與月份名稱。 |
| `openCalendarText` | locale | 日期 icon 的輔助文字。 |
| `currentText` / `closeText` / `okText` | locale | 自訂 popup 按鈕文字。 |
| `yearText` / `previousYearText` / `nextYearText` | locale | 自訂年份選擇 popup 文字。 |
| `onSelect` / `onShowPanel` / `onHidePanel` | `null` | 日期選取與 popup lifecycle callbacks。 |

```js
var dateBox = new fabui.EditBox('#date', {
  editor: 'date',
  locale: 'zh-TW',
  showLunar: true
});
```

`setTheme(theme)` 保留相容狀態，但不會載入或切換 Theme CSS。完整規則請見 [Theme API](./theme-api.md)。

### Combo options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `data` | `null` | 本機資料 Array；也可直接由 `<select>` options 建立。 |
| `valueField` / `textField` | `value` / `text` | 選項值與顯示文字欄位。 |
| `groupField` | `null` | 選項分組欄位。 |
| `groupPosition` | `static` | 分組標題位置。 |
| `groupFormatter` | `null` | 分組標題格式化 function。 |
| `mode` | `local` | `local` 或 `remote`。 |
| `url` / `method` | `null` / `post` | 遠端資料端點與 GET／POST method。 |
| `loader` | `null` | 自訂 loader，簽名為 `(params, success, error)`；也可回傳 Promise。 |
| `queryParams` | `{}` | 遠端載入附加參數。 |
| `loadFilter` | identity | 將回應轉為 Array 或 `{ rows }` 的 function。 |
| `panelWidth` / `panelHeight` | `null` / `300` | Popup 尺寸；寬度至少跟隨 EditBox。 |
| `panelMinWidth` / `panelMaxWidth` | `null` | Popup 最小／最大寬度。 |
| `panelMinHeight` / `panelMaxHeight` | `null` | Popup 最小／最大高度。 |
| `panelAlign` / `panelValign` | `left` / `auto` | Popup 水平與垂直定位。 |
| `fitContent` | `true` | 選項內容較寬時自動加寬 Popup；仍受 `panelMaxWidth` 與 viewport 限制。 |
| `multiple` | `false` | 啟用多選。 |
| `separator` | `,` | 多選文字分隔字元。 |
| `hasDownArrow` | `true` | 顯示右側下拉 icon。 |
| `selectOnNavigation` | `true` | 鍵盤移動 active item 時同步選取。 |
| `showItemIcon` | `false` | 顯示資料列的 icon。 |
| `showValueInList` | `false` | 在選項文字旁顯示原始 value。 |
| `limitToList` | `false` | 限制輸入內容必須存在於清單。 |
| `delay` | `200` | 搜尋或遠端查詢 debounce 毫秒數。 |
| `locale` / `openListText` | `en` / locale | 語系與下拉 icon 的輔助文字。 |
| `filter` / `formatter` | 內建 | 本機篩選與選項顯示 function。 |
| `onBeforeLoad` / `onLoadSuccess` / `onLoadError` | `null` | 遠端載入 callbacks。 |
| `onSelect` / `onUnselect` / `onClick` | `null` | 選項互動 callbacks。 |

### Color options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `palette` | 60 色 | Popup 色票；`colors` 為相容別名。 |
| `showAlpha` | `true` | 顯示透明度控制；關閉時固定輸出六碼 hex。 |
| `panelWidth` | `420` | Popup 寬度。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `openColorText` | locale | 色盤 icon 的輔助文字。 |
| `saturationText` / `hueText` / `alphaText` | locale | 色彩控制項的輔助文字。 |
| `onSelect` / `onShowPanel` / `onHidePanel` | `null` | 顏色選取與 popup lifecycle callbacks。 |

Date、Combo、Color popup 都支援 `Escape` 與點擊控件外部關閉；點擊 popup 內部或右側 trigger 不會誤關閉。同一頁同時開啟多個 EditBox popup 時，點進其中一個會關閉其餘 popup。

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

除 getter、`destroy()` 與 `dispose()` 外，共用 methods 皆回傳 `fabui.EditBox` instance，可串接呼叫。

## Events

使用 `editBox.on(name, listener)` 訂閱，使用 `off(name, listener)` 解除：

| Event | 適用類型 | Event detail |
| --- | --- | --- |
| `change` | 全部 | `{ value, oldValue }` |
| `resize` | 全部 | `{ width, height }` |
| `iconClick` | 全部 | `{ index, icon }` |
| `buttonClick` | 全部 | `{ button }` |
| `select` / `unselect` | `combo` | `{ record }` |
| `select` | `date` / `color` | `{ date }` 或 `{ value }` |
| `click` | `combo` | `{ record }` |
| `loadSuccess` / `loadError` | `combo` | `{ data }` 或 `{ error }` |
| `showPanel` / `hidePanel` | `date` / `combo` / `color` | `{ panel }` |

## 類型專用 methods

- NumberBox：`getNumber()`、`fix()`。
- TimeBox：`getTime()`、`fix()`；`getTime()` 回傳 `{ hour, minute, second }`，無效或不完整時回傳 `null`。
- 共用：`setLocale(locale, messages?)`；Date／Combo／Color 會立即更新 popup 與 trigger 的輔助文字。
- DateBox：`getDate()`、`setDate(date)`、`setTheme(theme)`、`calendar()`、`panel()`、`showPanel()`、`hidePanel()`、`togglePanel()`、`cloneFrom(from)`、`fix()`。
- ComboBox：`getData()`、`loadData(data)`、`reload()`、`getValues()`、`setValues(values)`、`select(value)`、`unselect(value)`、`scrollTo(value)`、`panel()`、`showPanel()`、`hidePanel()`、`togglePanel()`。
- Color：`panel()`、`showPanel()`、`hidePanel()`、`togglePanel()`；支援 `palette`／`colors` 與 `showAlpha`。

## 靜態 API

- `fabui.EditBox.editorTypes`：目前公開的六種 editor 類型。
- `fabui.EditBox.editorDefinitions`：與 FabGrid 共用的完整 editor definitions。
- `fabui.EditBox.getEditorDefinition(name)`：依名稱取得 definition。
- `fabui.EditBox.getControl(elementOrSelector)`：由原始 input／textarea／select 取得 `fabui.EditBox` instance；找不到時回傳 `null`。

Core 只建立一份共用 definitions，因此 `fabui.EditBox.editorDefinitions === fabui.editorDefinitions`。

API 命名以 EasyUI TextBox 的共用 value、state、event methods 為基準，DateBox 與 ComboBox 只補最常用的 panel、calendar、data 與 selection methods，不追求完整 EasyUI plugin 相容層。

## Demo

- [Source-mode 開發版](../demo/dev-editbox.html)
- [Build-mode 正式版](../demo/editbox.html)
