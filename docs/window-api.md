# fabui.Window API

`fabui.Window` 是 FabUI core 內建的 pure JavaScript 浮動視窗元件。API 與視覺參考 jQuery EasyUI Window／Default theme，但不依賴 jQuery、EasyUI、draggable 或 resizable runtime。

Window 與 Panel 共用各 theme 的工具圖示。內建狀態 icon 不顯示 hover 效果，但保留鍵盤 `focus-visible` 提示。

正式 source 與 build 不依賴本機參考用的 `res/`。

Window 疊合後只保留標題列，外框高度約為 38px；展開時恢復原本設定的高度。

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
| `minimizable` | `false` | 顯示最小化工具。啟用後預設縮成約 220×38px 並停靠可用範圍左下角，工具會切換成還原。 |
| `minimizeTarget` | `null` | 可傳入 Element、selector、`{ left, top, width, height }` 或回傳其中任一值的 function；設定後最小化與還原動畫會精確對應該目標矩形。 |
| `maximizable` | `true` | 顯示最大化／還原工具。 |
| `closable` | `true` | 顯示關閉工具。 |
| `closed` | `false` | 建立後保持關閉。 |
| `noheader` | `false` | 隱藏標題列。 |
| `iconCls` | `''` | 左上角標題 icon class，統一使用 `icon-xxx`，例如 `icon-window`。 |
| `cls` | `''` | 加到 Window 外框的自訂 class。 |
| `animate` | `true` | 最大化／還原、最小化／重新開啟與收合／展開是否使用過渡動畫。 |
| `animationDuration` | `180` | 狀態過渡時間，單位為毫秒。系統偏好減少動態效果時自動停用。 |
| `tools` | `null` | 自訂 `{ iconCls, text, title, ariaLabel, onClick }` 工具陣列。 |
| `footer` | `null` | Footer element 或純文字。 |
| `theme` | `inherit` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
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
| `minimize()` / `maximize()` / `restore()` | 最小化至 `minimizeTarget` 或預設左下角、最大化，或還原最小化／最大化前的尺寸與位置。 |
| `bringToFront()` | 提高 Window 與 modal mask 的 z-index。 |
| `setTitle(title)` | 更新標題。 |
| `setIcon(iconCls)` | 更新左上角標題 icon；傳入 `''` 可移除。 |
| `setContent(content)` | 寫入純文字或 DOM Node。 |
| `setTheme(theme)` | 更新相容 theme 狀態，不載入或切換 CSS。 |
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

所有 `before*` callback 或 listener 回傳 `false` 都會取消該次操作。縮放期間只更新虛線預覽框，不改變實際 Window 或內容尺寸；`pointerup` 才一次提交新位置與尺寸並觸發 `Resize`，`pointercancel` 會放棄預覽。拖曳與縮放所需的 document pointer listeners 只在互動期間綁定，完成、取消或 dispose 時立即解除。
