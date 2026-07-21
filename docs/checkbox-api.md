# fabui.CheckBox API 操作手冊

`fabui.CheckBox` 是 FabUI core 內建的 pure JavaScript 核取方塊。API 與 Default 視覺參考 jQuery EasyUI CheckBox，但不依賴 jQuery 或 EasyUI runtime。元件保留原生 `<input type="checkbox">`，所以表單 name/value、label 點擊、Space 鍵與 form reset 仍使用瀏覽器原生行為。

## 建立

```html
<input id="fruit" type="checkbox" name="fruit">
<script>
  var checkbox = new fabui.CheckBox('#fruit', {
    label: 'Apple:',
    value: 'Apple',
    checked: true,
    onChange: function(checked) {
      console.log(checked);
    }
  });
</script>
```

也可直接從 markup 讀取官方相容屬性：

```html
<input
  id="orange"
  type="checkbox"
  name="fruit"
  value="Orange"
  label="Orange:"
  checked>
```

同一個 input 重複建立時會回傳既有 instance。也可用 `fabui.CheckBox.getControl(input)` 或 `fabui.Control.getControl(input)` 取得 instance。

## Options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `width` | `20` | Checkbox 寬度，接受 number 或 CSS size。 |
| `height` | `20` | Checkbox 高度，接受 number 或 CSS size。 |
| `value` | `null` | 原生 input 提交值。 |
| `checked` | `false` | 初始勾選狀態。 |
| `disabled` | `false` | 停用 input、label 與 pointer 操作。 |
| `label` | `null` | 與 input 綁定的 label 文字。 |
| `labelWidth` | `'auto'` | Label 寬度。 |
| `labelPosition` | `'after'` | `'before'`、`'after'`、`'top'`；預設文字顯示在核取方塊後方。 |
| `labelAlign` | `'left'` | `'left'` 或 `'right'`。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`，用於沒有 label 時的 ARIA 名稱。 |
| `theme` | `'inherit'` | 繼承外層 `fg-theme-*`，或指定 19 組 FabUI theme。 |
| `cls` | `''` | 加到外層 wrapper 的自訂 class。 |
| `ariaLabel` | `''` | 覆寫原生 input 的可及性名稱。 |
| `onChange(checked)` | `null` | 勾選狀態改變後觸發。 |

## Methods

官方 EasyUI 相容方法：

| Method | 說明 |
| --- | --- |
| `options()` | 回傳目前 options 副本。 |
| `setValue(value)` | 更新原生 input 的表單提交值。 |
| `disable()`／`enable()` | 停用或啟用。 |
| `check()`／`uncheck()` | 勾選或取消勾選。 |
| `clear()` | 清除勾選狀態。 |
| `reset()` | 還原建立元件時的 value 與 checked。 |

FabUI lifecycle 與便利方法：

| Method | 說明 |
| --- | --- |
| `getValue()` | 取得目前原生 input value。 |
| `isChecked()` | 取得目前 checked boolean。 |
| `setOptions(options)` | 合併 options 並更新視覺與原生 input。 |
| `resize(width?, height?)` | 更新 Checkbox 尺寸。 |
| `setLabel(label)` | 更新 label。 |
| `setLocale(locale, messages?)` | 更新語系或註冊自訂 ARIA 文字。 |
| `setTheme(theme)` | 更新或重新繼承 theme。 |
| `destroy()`／`dispose()` | 移除 wrapper 與 listener、解除 registry，還原原始 input。 |

所有 setter methods 都回傳 CheckBox instance。

## Events

```js
checkbox.on('change', function(event) {
  console.log(event.detail.checked);
  console.log(event.detail.value);
});
```

`onChange(checked)` 與 native emitter `change` 會在使用者點擊、鍵盤切換，或呼叫 `check()`、`uncheck()`、`clear()`、`reset()` 改變 checked 狀態時觸發。重複設定相同狀態不會重複觸發。

## 表單與可及性

- 原生 input 仍位於表單內，勾選時會依 `name`／`value` 送出。
- Label 使用 `for` 與 input id 綁定；input 沒有 id 時會建立暫時 id，dispose 時還原。
- `Space`、Tab focus、disabled 與 form reset 保留原生行為。
- 沒有 label 時使用 locale 的 ARIA 名稱；也可設定 `ariaLabel` 覆寫。
- 支援 `forced-colors` 與 `prefers-reduced-motion`。

Source-mode Demo：[`demo/dev-checkbox.html`](../demo/dev-checkbox.html)
Build-mode Demo：[`demo/checkbox.html`](../demo/checkbox.html)
