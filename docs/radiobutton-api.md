# fabui.RadioButton API 操作手冊

`fabui.RadioButton` 是 pure JavaScript 單選按鈕，API 與視覺參考 jQuery EasyUI RadioButton。元件直接包裝原生 `<input type="radio">`，保留 name/value、label、鍵盤、disabled、FormData 與表單 reset 語意。

## 建立元件

```html
<input id="fruit-apple" type="radio" name="fruit" value="Apple">
```

```js
var radio = new fabui.RadioButton('#fruit-apple', {
  label: 'Apple:',
  checked: true
});
```

## Options

| 名稱 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `width` | number/string | `20` | 圓鈕寬度。 |
| `height` | number/string | `20` | 圓鈕高度。 |
| `value` | any | `null` | 原生 radio value。 |
| `checked` | boolean | `false` | 初始選取狀態。 |
| `disabled` | boolean | `false` | 是否停用。 |
| `label` | string/null | `null` | 顯示文字。 |
| `labelWidth` | number/string | `'auto'` | label 寬度。 |
| `labelPosition` | string | `'after'` | `before`、`after` 或 `top`；預設文字顯示在選項按鈕後方。 |
| `labelAlign` | string | `'left'` | `left` 或 `right`。 |
| `locale` | string | `'en'` | `en`、`zh-TW` 或 `zh-CN`。 |
| `theme` | string | `'inherit'` | 繼承外層或指定 19 組 FabUI theme。 |
| `ariaLabel` | string | `''` | 覆寫 radio 的 accessible name。 |
| `onChange` | function | `null` | checked 改變時接收 `(checked)`。 |

## Methods

| 方法 | 說明 |
| --- | --- |
| `options()` | 取得 options 副本。 |
| `setOptions(options)` | 更新 options 與畫面。 |
| `getValue()` | 取得原生 radio value。 |
| `setValue(value)` | 更新原生 radio value。 |
| `isChecked()` | 取得選取狀態。 |
| `check()` | 選取並同步取消同 name 的其他 RadioButton。 |
| `uncheck()`／`clear()` | 清除目前選取狀態。 |
| `reset()` | 還原建立元件時的 value 與 checked。 |
| `disable()`／`enable()` | 停用或啟用。 |
| `resize(width, height)` | 更新圓鈕尺寸。 |
| `setLabel(label)` | 更新 label。 |
| `setLocale(locale, messages?)` | 切換語系，可附加自訂訊息。 |
| `setTheme(theme)` | 切換 theme。 |
| `on(type, listener)`／`off(type, listener)` | 管理 FabUI change/refresh listener。 |
| `dispose()`／`destroy()` | 解除事件、Control registry 並還原原始 input。 |

## Events

- option callback：`onChange(checked)`
- emitter：`change`，`event.detail` 包含 `checked`、`value`、`originalEvent`
- emitter：`refresh`

## 靜態 API

- `fabui.RadioButton.defaults`
- `fabui.RadioButton.locales`
- `fabui.RadioButton.themes`
- `fabui.RadioButton.addLocale(name, messages)`
- `fabui.RadioButton.getControl(elementOrSelector)`
- `fabui.RadioButton.normalizeTheme(theme)`
- `fabui.RadioButton.normalizeLocale(locale)`
