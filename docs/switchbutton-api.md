# fabui.SwitchButton API 操作手冊

`fabui.SwitchButton` 是 FabUI core 內建的 pure JavaScript 切換按鈕。API、滑動方式與視覺參考 jQuery EasyUI SwitchButton 1.11.5，但不依賴 jQuery 或 EasyUI runtime。既有 16 組主題分別對應本機 `res/themes/<theme>/switchbutton.css`；`mono` 沿用 Default 結構並套用單色 SVG icon。正式 source、Demo 與 build 不會依賴 `res/`。

元件直接包裝原生 `<input type="checkbox">`，因此 name/value、FormData、label、Space 鍵、disabled 與 form reset 都保留瀏覽器原生語意。

## 建立

```html
<input id="receive-mail" type="checkbox" name="service" value="mail">
<script>
  var switchButton = new fabui.SwitchButton('#receive-mail', {
    label: 'Receive mail:',
    labelWidth: 120,
    checked: true,
    onChange: function(checked) {
      console.log(checked);
    }
  });
</script>
```

同一個 input 重複建立時會回傳既有 instance。也可使用 `fabui.SwitchButton.getControl(input)` 或 `fabui.Control.getControl(input)` 取得 instance。

## Options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `width` | `60` | 控件寬度，單位為 px。 |
| `height` | `30` | 控件高度，對應本機 EasyUI 1.11.5 參考版本。 |
| `handleWidth` | `'auto'` | Handle 寬度；`auto` 時等於控件高度。 |
| `checked` | `false` | 初始開關狀態。 |
| `disabled` | `false` | 停用原生 input 與互動。 |
| `readonly` | `false` | 保留焦點但不允許切換狀態。 |
| `reversed` | `false` | 反轉 ON／OFF 的位置與滑動方向。 |
| `onText` | `'ON'` | 開啟狀態文字。 |
| `offText` | `'OFF'` | 關閉狀態文字。 |
| `handleText` | `''` | Handle 內的文字。 |
| `value` | `'on'` | 原生 checkbox 被勾選時送出的值。 |
| `label` | `null` | 外部 label 文字。 |
| `labelWidth` | `'auto'` | Label 寬度。 |
| `labelPosition` | `'before'` | `before`、`after` 或 `top`。 |
| `labelAlign` | `'left'` | `left` 或 `right`。 |
| `locale` | `'en'` | `en`、`zh-TW` 或 `zh-CN`；中文別名會正規化。 |
| `theme` | `'inherit'` | 繼承外層 `fg-theme-*`，或指定 19 組內建主題。 |
| `cls` | `''` | 加到最外層 wrapper 的自訂 class。 |
| `ariaLabel` | `''` | 覆寫原生 input 的 ARIA label。 |
| `onChange` | `null` | 狀態改變後呼叫 `(checked)`。 |

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 回傳目前 options 的淺層副本。 |
| `setOptions(options)` | 更新 options 並重繪。 |
| `resize(width, height)` | 更新尺寸。 |
| `resize({ width, height, handleWidth })` | 使用物件更新尺寸。 |
| `disable()`／`enable()` | 停用或啟用。 |
| `readonly(mode)` | 設定唯讀；省略 mode 時設為 `true`。 |
| `check()`／`uncheck()` | 開啟或關閉。 |
| `clear()` | 關閉。 |
| `reset()` | 回復建立時的 checked 與 value。 |
| `isChecked()` | 回傳目前狀態。 |
| `getValue()`／`setValue(value)` | 讀寫原生 input value。 |
| `setLabel(label)` | 更新 label。 |
| `setLocale(locale, messages?)` | 切換語系；可附加自訂訊息。 |
| `setTheme(theme)` | 切換或重新繼承主題。 |
| `on(type, listener)`／`off(type, listener?)` | 管理 FabUI 事件。 |
| `dispose()`／`destroy()` | 解除 listener、registry 並還原原生 input。 |

所有狀態與 setter methods 都回傳 SwitchButton instance，方便串接呼叫。

## Events

```js
switchButton.on('change', function(event) {
  console.log(event.detail.checked);
  console.log(event.detail.value);
  console.log(event.detail.originalEvent);
});
```

`onChange(checked)` 與 `change` event 只在狀態實際改變時觸發。原生 form reset 會安靜地回復建立時狀態。

## 表單行為

```html
<form id="settings">
  <input id="notifications" type="checkbox" name="notifications" value="enabled">
</form>
```

SwitchButton 開啟時，`new FormData(form)` 會包含 `notifications=enabled`；關閉或 disabled 時不會送出。元件不會搬移或移除原生 input 的 name。

## 主題

公開 metadata：

- `fabui.SwitchButton.defaults`
- `fabui.SwitchButton.locales`
- `fabui.SwitchButton.themes`
- `fabui.SwitchButton.addLocale(name, messages)`
- `fabui.SwitchButton.normalizeLocale(locale)`
- `fabui.SwitchButton.normalizeTheme(theme)`

19 組主題為：`default`、`bootstrap`、`cupertino`、`material`、`material-blue`、`material-teal`、`metro`、`metro-blue`、`metro-gray`、`metro-green`、`metro-orange`、`metro-red`、`sunny`、`pepper-grinder`、`dark-hive`、`black`、`mono`、`mono-red`、`mono-green`。

## Demo

Source-mode Demo：[`demo/dev-switchbutton.html`](../demo/dev-switchbutton.html)
Build-mode Demo：[`demo/switchbutton.html`](../demo/switchbutton.html)
