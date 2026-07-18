# fabui.Window API

`fabui.Window` 是 FabUI core 內建的 pure JavaScript 浮動視窗元件。API 與 Material Teal 視覺參考 jQuery EasyUI Window，但不依賴 jQuery、EasyUI、draggable 或 resizable runtime。

## 建立 Window

```html
<div id="customerWindow">
  Window content
</div>
```

```js
var win = new fabui.Window('#customerWindow', {
  title: '客戶資料',
  iconCls: 'icon-window',
  width: 600,
  height: 400,
  modal: true,
  constrain: true,
  locale: 'zh-TW'
});
```

Window 會保留原本 host element 作為 body。`destroy()`／`dispose()` 後，host 會回到原本 DOM 位置並還原原始 class 與 inline style。

## Options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `title` | `New Window` | 標題文字。 |
| `width` / `height` | `600` / `400` | Window 外框尺寸。 |
| `left` / `top` | `null` / `null` | 初始位置；未指定時置中。 |
| `minWidth` / `minHeight` | `200` / `100` | 縮放下限。 |
| `zIndex` | `9000` | 初始堆疊基準；點擊或開啟時自動提高。 |
| `draggable` | `true` | 可拖曳標題列移動。 |
| `resizable` | `true` | 可從四邊與四角縮放。 |
| `shadow` | `true` | 顯示陰影。 |
| `modal` | `false` | 顯示遮罩並阻擋背景操作。 |
| `border` | `true` | `true`、`false` 或 `thin`。 |
| `inline` | `false` | `true` 時留在原本 parent；否則移至 `document.body`。 |
| `fixed` | `false` | 使用 fixed positioning。 |
| `constrain` | `false` | 將移動與縮放限制在 viewport 或 inline parent 內。 |
| `collapsible` | `false` | 顯示收合工具。啟用後收合／展開會使用過渡動畫。 |
| `minimizable` | `false` | 顯示最小化工具。啟用後最小化／重新開啟會使用過渡動畫。 |
| `maximizable` | `true` | 顯示最大化／還原工具。 |
| `closable` | `true` | 顯示關閉工具。 |
| `closed` | `false` | 建立後保持關閉。 |
| `noheader` | `false` | 隱藏標題列。 |
| `iconCls` | `''` | 左上角標題 icon class，統一使用 `icon-xxx`，例如 `icon-window`。 |
| `animate` | `true` | 最大化／還原、最小化／重新開啟與收合／展開是否使用過渡動畫。 |
| `animationDuration` | `180` | 狀態過渡時間，單位為毫秒。系統偏好減少動態效果時自動停用。 |
| `tools` | `null` | 自訂 `{ iconCls, text, title, ariaLabel, onClick }` 工具陣列。 |
| `footer` | `null` | Footer element 或純文字。 |
| `theme` | `inherit` | 繼承外層 `fg-theme-*`；也可指定 FabUI 內建 theme。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `messages` | `null` | 覆寫工具按鈕的多語系文字。 |

## Properties 與 DOM getters

| 名稱 | 說明 |
| --- | --- |
| `options` | 目前完整 options 與 `closed`、`collapsed`、`minimized`、`maximized` 狀態。 |
| `hostElement` | 原始內容 element。 |
| `window()` / `panel()` | Window 外框 element。 |
| `header()` / `body()` / `footer()` | 對應 DOM element。 |
| `isOpen()` | Window 可見且未最小化時回傳 `true`。 |

## Methods

所有 setter 與操作 methods 都回傳 Window instance。

| Method | 說明 |
| --- | --- |
| `open(force?)` / `close(force?)` | 開啟或關閉；`force === true` 略過 before callback。 |
| `destroy(force?)` / `dispose()` | 解除 listeners、registry、mask 與 DOM wrapper，並還原 host。 |
| `move({ left, top })` | 移動 Window。 |
| `resize(width, height)` / `resize({ width, height })` | 調整尺寸。 |
| `center()` / `hcenter()` / `vcenter()` | 完整、水平或垂直置中。 |
| `collapse()` / `expand()` | 收合或展開內容。 |
| `minimize()` / `maximize()` / `restore()` | 最小化、最大化與還原。 |
| `bringToFront()` | 提高 Window 與 modal mask 的 z-index。 |
| `setTitle(title)` | 更新標題。 |
| `setIcon(iconCls)` | 更新左上角標題 icon；傳入 `''` 可移除。 |
| `setContent(content)` | 寫入純文字或 DOM Node。 |
| `setTheme(theme)` | 套用 theme；傳入 `inherit` 重新讀取外層 theme。 |
| `setLocale(locale, messages?)` | 切換工具按鈕語系。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除 Window event。 |

## Events

Constructor callback 使用 `onBeforeOpen`、`onOpen` 形式；`on()` 使用小寫名稱，例如 `win.on('move', handler)`。

| Event | Detail |
| --- | --- |
| `beforeopen` / `open` | Window 開啟。 |
| `beforeclose` / `close` | Window 關閉。 |
| `beforedestroy` / `destroy` | Window 銷毀。 |
| `beforecollapse` / `collapse` | 收合。 |
| `beforeexpand` / `expand` | 展開。 |
| `move` | `{ left, top, window }` |
| `resize` | `{ width, height, window }` |
| `minimize` / `maximize` / `restore` | 對應狀態完成。 |

所有 `before*` callback 或 listener 回傳 `false` 都會取消該次操作。拖曳與縮放所需的 document pointer listeners 只在互動期間綁定，完成、取消或 dispose 時立即解除。
