# fabui.RadioGroup API 操作手冊

`fabui.RadioGroup` 參考 jQuery EasyUI RadioGroup，直接以既有 `fabui.RadioButton` 建立每個項目。每個項目仍是原生 `<input type="radio">`，可直接使用 FormData 與表單 reset。

## 建立元件

```html
<div id="fruit-group"></div>
```

```js
var group = new fabui.RadioGroup('#fruit-group', {
  name: 'fruit',
  value: 'apple',
  data: [
    { value: 'apple', label: 'Apple' },
    { value: 'orange', label: 'Orange', disabled: true },
    { value: 'banana', label: 'Banana' }
  ]
});
```

## Options

| 名稱 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `name` | string | `''` | 每個原生 radio 的 name。 |
| `value` | any/null | `null` | 目前選取值。 |
| `data` | array | `[]` | `{ value, label, disabled }` 項目。 |
| `dir` | string | `'h'` | `h` 水平或 `v` 垂直。 |
| `itemStyle` | object | `{ height: 30 }` | 套用到每個項目容器的 inline style。 |
| `labelWidth` | number/string | `'auto'` | 每個 label 寬度。 |
| `labelPosition` | string | `'after'` | `before` 或 `after`；預設每個項目文字顯示在選項按鈕後方。 |
| `labelAlign` | string | `'left'` | `left` 或 `right`。 |
| `disabled` | boolean | `false` | 是否停用整組。 |
| `cls` | string | `''` | 加到 RadioGroup host 的自訂 class。 |
| `locale` | string | `'en'` | `en`、`zh-TW` 或 `zh-CN`。 |
| `theme` | string | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `ariaLabel` | string | `''` | radiogroup accessible name。 |
| `onChange` | function | `null` | 選取值改變時接收 `(value)`。 |

## Methods

| 方法 | 說明 |
| --- | --- |
| `options()` | 取得 options 副本。 |
| `setOptions(options)` | 更新 options 並重建項目。 |
| `setValue(value)`／`check(value)` | 選取指定 value。 |
| `getValue()` | 取得選取值，未選取時為 `null`。 |
| `getData()` | 取得正規化資料副本。 |
| `getRadioButton(value)` | 取得指定項目的 `fabui.RadioButton`。 |
| `loadData(data, value?)` | 載入資料並設定選取值。 |
| `clear()` | 清除選取值。 |
| `reset()` | 還原建立元件時的選取值。 |
| `disable()`／`enable()` | 停用或啟用整組，保留單項 disabled。 |
| `setLocale(locale, messages?)` | 切換語系。 |
| `setTheme(theme)` | 同步所有 RadioButton 的相容 theme 狀態。 |
| `on(type, listener)`／`off(type, listener)` | 管理 FabUI change/refresh listener。 |
| `dispose()`／`destroy()` | dispose 所有 RadioButton 並還原 host。 |

## Events

- option callback：`onChange(value)`
- emitter：`change`，`event.detail` 包含 `value`、`oldValue`
- emitter：`refresh`

## 靜態 API

- `fabui.RadioGroup.defaults`
- `fabui.RadioGroup.locales`
- `fabui.RadioGroup.themes`
- `fabui.RadioGroup.addLocale(name, messages)`
- `fabui.RadioGroup.getControl(elementOrSelector)`
- `fabui.RadioGroup.normalizeTheme(theme)`
- `fabui.RadioGroup.normalizeLocale(locale)`
