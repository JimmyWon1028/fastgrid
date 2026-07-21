# fabui.Tooltip API

`fabui.Tooltip` 是 FabUI core 內建的 pure JavaScript 提示元件。API 與 Default 視覺參考 jQuery EasyUI Tooltip，但不依賴 jQuery 或 EasyUI runtime。

## 建立 Tooltip

```html
<button id="help" title="說明內容">說明</button>

<script>
  var tooltip = new fabui.Tooltip('#help');
</script>
```

若未傳入 `content`，會使用 host 原本的 `title`。元件建立期間會移除原生 `title`，避免出現兩個提示；`destroy()` 後會還原。

```js
var tooltip = new fabui.Tooltip('#help', {
  position: 'right',
  content: '<strong>HTML 內容</strong>',
  onShow: function(event) {
    console.log('shown');
  }
});
```

## Options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `position` | `'bottom'` | `left`、`right`、`top`、`bottom`；空間不足時自動翻轉或限制於 viewport。 |
| `valign` | `'middle'` | 左／右 Tooltip 使用 `middle` 或 `top` 對齊。 |
| `content` | `null` | HTML 字串或回傳 HTML 的 function；未設定時使用 `title`。 |
| `trackMouse` | `false` | 跟隨滑鼠位置。 |
| `deltaX` / `deltaY` | `0` | 定位偏移；可傳 number 或依實際方向回傳 number 的 function。 |
| `showEvent` | `'mouseenter'` | 觸發顯示的事件名稱；空字串代表只使用 `show()`。 |
| `hideEvent` | `'mouseleave'` | 觸發隱藏的事件名稱；空字串仍可用 `hide()`、Escape 或外部點擊關閉。 |
| `showDelay` | `200` | 顯示延遲毫秒。 |
| `hideDelay` | `100` | 隱藏延遲毫秒。 |
| `zIndex` | `9900000` | Tooltip 層級。 |
| `theme` | `'inherit'` | 繼承最近的 `fg-theme-*`，或指定 19 組內建 theme。 |

Markup 可使用 `position`、`valign`、`content`、`trackMouse`、`deltaX`、`deltaY`、`showEvent`、`hideEvent`、`showDelay`、`hideDelay`，也可使用對應的 `data-*` 屬性。

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 options。 |
| `tip()` | 取得 Tooltip element；第一次顯示前為 `null`。 |
| `arrow()` | 取得 `{ outer, inner }` 箭頭 elements；第一次顯示前為 `null`。 |
| `show(event?)` | 依 `showDelay` 顯示。 |
| `hide(event?)` | 依 `hideDelay` 隱藏。 |
| `update(content)` | 更新 HTML 或 content function 並重新定位。 |
| `reposition()` | 依 host、滑鼠與 viewport 重新定位。 |
| `setTheme(theme)` | 切換或重新繼承 theme。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除事件。 |
| `destroy()` / `dispose()` | 清除 timers、DOM、事件與 Control registry，還原 host。 |

`show()` 會關閉其他已開啟的 `fabui.Tooltip`。顯示後可按 `Escape` 或點擊 Tooltip 與 trigger 外部關閉；點擊 Tooltip 內容或 trigger 不會誤關閉。

## Events

Options callbacks 沿用 EasyUI 的參數順序：

| Callback | 參數 |
| --- | --- |
| `onShow` | `event` |
| `onHide` | `event` |
| `onUpdate` | `content` |
| `onPosition` | `left, top` |
| `onDestroy` | 無 |

`on(name, listener)` 支援 `show`、`hide`、`update`、`position`、`destroy`；listener 會收到包含 `tooltip`、`tip`、`originalEvent`、`content` 或定位資訊的 event args。

## Theme

支援 `default`、`bootstrap`、`cupertino`、`material`、`material-blue`、`material-teal`、`metro`、`metro-blue`、`metro-gray`、`metro-green`、`metro-orange`、`metro-red`、`sunny`、`pepper-grinder`、`dark-hive`、`black`、`mono`。

色彩與圓角映射整理自本機 `res/themes/*/tooltip.css`；正式 source、Demo 與 build 不依賴 `res/`。
