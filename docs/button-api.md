# fabui.Button API

`fabui.Button` 是 FabUI core 內建的 pure JavaScript 按鈕元件。視覺與主要 options 參考 jQuery EasyUI LinkButton，但不依賴 jQuery 或 EasyUI runtime。host 必須是 `<a>` 或 `<button>`。

## 建立 Button

```html
<button id="saveButton" type="button">儲存</button>
```

```js
var saveButton = new fabui.Button('#saveButton', {
  text: '儲存',
  iconCls: 'icon-save',
  onClick: function(sender, args) {
    console.log(sender.options.text, args.originalEvent);
  }
});
```

Anchor 仍保留原本連結行為：

```html
<a id="helpButton" href="./help.html">說明</a>
```

```js
new fabui.Button('#helpButton', {
  iconCls: 'icon-help'
});
```

## Options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `width` / `height` | `null` / `null` | number 轉為 px，也接受 `80%` 等 CSS 尺寸。 |
| `id` | `null` | host 的 `id`。 |
| `disabled` | `false` | 停用 click、連結導覽與鍵盤操作。 |
| `toggle` | `false` | click 時切換 selected 狀態。 |
| `selected` | `false` | 初始 selected 狀態。 |
| `group` | `null` | Toggle group 名稱；同組只保留一個 selected Button。 |
| `plain` | `false` | 平常使用透明背景與透明 border。 |
| `outline` | `false` | 只顯示外框的 Button。 |
| `text` | `''` | 顯示文字，使用 `textContent` 安全寫入。 |
| `iconCls` | `null` | 16×16 icon class，統一使用 `icon-xxx`。 |
| `iconAlign` | `left` | `left`、`right`、`top`、`bottom`。 |
| `size` | `small` | `small` 或 `large`。 |
| `fit` | `false` | 寬高填滿 parent。 |
| `cls` | `''` | 額外套用到 host 的 class。 |
| `theme` | `inherit` | 繼承外層 `fg-theme-*` 或指定 FabUI theme。 |
| `onClick` | `null` | click callback；回傳 `false` 可阻止 anchor 導覽。 |

## Properties

| 名稱 | 說明 |
| --- | --- |
| `options` | 目前 options 與 selected／disabled 狀態。 |
| `hostElement` | 原始 `<a>` 或 `<button>`。 |
| `theme` | 目前解析後的 FabUI theme。 |

## Methods

所有 setter 與狀態 methods 都回傳 Button instance。

| Method | 說明 |
| --- | --- |
| `resize({ width, height })` | 動態調整尺寸。 |
| `disable()` / `enable()` | 停用或啟用。 |
| `select()` / `unselect()` | 設定 selected；group Button 不可直接 unselect，需選取同組另一項。 |
| `setText(text)` | 更新安全純文字。 |
| `setIcon(iconCls, iconAlign?)` | 更新 icon 與可選的排列方向。 |
| `setTheme(theme)` | 套用或重新繼承 theme。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除事件。 |
| `destroy()` / `dispose()` | 解除 listeners、Control registry，並還原 host 原始 DOM、class、style 與 ARIA。 |

## Events

Constructor callback 使用 `onClick`、`onSelect`、`onUnselect`、`onResize`；`on()` 使用小寫名稱。

| Event | Detail |
| --- | --- |
| `click` | `{ button, originalEvent, selected }` |
| `select` / `unselect` | `{ button, selected }` |
| `resize` | `{ button, width, height }` |

Toggle Button 會維護 `aria-pressed`；disabled Button 會維護 native `disabled` 或 `aria-disabled`。鍵盤操作保留原生 `<button>`／`<a>` 行為，無 `href` 的 anchor 另支援 Enter 與 Space。
