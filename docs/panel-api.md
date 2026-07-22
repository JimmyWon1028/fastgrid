# fabui.Panel API

`fabui.Panel` 是 FabUI core 內建的 pure JavaScript 內容容器。API 與視覺參考 jQuery EasyUI Panel／Default theme，但不依賴 jQuery 或 EasyUI runtime。

收合、展開、最小化、最大化、還原與關閉工具使用各 theme 對應的 `panel_tools.png` sprite。既有 16 組主題的 header、body、footer、邊框、文字、gradient 與其他 tool hover 色均對應本機 `res/themes/<theme>/panel.css`；`mono` 沿用 Default 結構並套用單色 SVG icon。收合與展開 icon 不顯示滑鼠 hover 效果，鍵盤 `focus-visible` 提示仍保留。正式 source 與 build 不依賴 `res/`。

## 建立

```html
<div id="customerPanel">
  <p>Panel content</p>
</div>
```

```js
var panel = new fabui.Panel('#customerPanel', {
  title: '客戶資料',
  width: 600,
  height: 320,
  collapsible: true,
  closable: true
});
```

`fabui.Control.getControl('#customerPanel')` 與 `fabui.Panel.getControl('#customerPanel')` 都可取得既有 instance。

## 主要 options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `id` | `null` | Panel 外框 id；省略時沿用或產生 id。 |
| `title` | `''` | Header 標題。 |
| `iconCls` | `''` | Header icon class。 |
| `width` / `height` | `'auto'` | 支援 number、CSS size 或 `auto`。 |
| `minWidth` / `maxWidth` | `null` | 尺寸限制。 |
| `minHeight` / `maxHeight` | `null` | 尺寸限制。 |
| `left` / `top` | `null` | 指定位置；設定後 Panel 使用 absolute positioning。 |
| `cls` | `''` | 加到 Panel 外框的自訂 class。 |
| `headerCls` / `bodyCls` | `''` | Header／body 的自訂 class。 |
| `style` | `null` | 套用到 Panel 外框的 inline style object。 |
| `fit` | `false` | 填滿父容器。 |
| `border` | `true` | 是否顯示外框。 |
| `noheader` | `false` | 隱藏 Header。 |
| `halign` | `'top'` | Header 位置：`top`、`left`、`right`。 |
| `titleDirection` | `'down'` | 垂直 Header 方向：`down`、`up`。 |
| `collapsible` | `false` | 顯示收合工具。 |
| `minimizable` | `false` | 顯示最小化工具。 |
| `maximizable` | `false` | 顯示最大化工具。 |
| `closable` | `false` | 顯示關閉工具。 |
| `tools` | `null` | 自訂工具 descriptor array。 |
| `footer` | `null` | Footer 字串或 HTMLElement。 |
| `content` | `null` | 初始化 body HTML。 |
| `collapsed` / `minimized` | `false` | 建立後保持收合或最小化。 |
| `maximized` / `closed` | `false` | 建立後保持最大化或關閉。 |
| `href` | `null` | 開啟／展開時延遲載入的 URL。 |
| `cache` | `true` | 是否快取已載入內容。 |
| `loadingMessage` | `''` | 遠端內容載入期間顯示的文字。 |
| `method` | `'get'` | 遠端載入 HTTP method。 |
| `queryParams` | `null` | 遠端載入參數。 |
| `loader` | `null` | 自訂 `(params, success, error)` loader。 |
| `extractor` | 內建 | 從 response 提取 Panel HTML。 |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`。 |
| `messages` | `null` | 覆寫目前 locale 的文字。 |
| `animate` | `true` | 最大化／還原、收合／展開時是否使用過渡動畫。 |
| `animationDuration` | `180` | 狀態過渡時間，單位為毫秒；會遵守 `prefers-reduced-motion`。 |

收合／展開會依 `halign` 決定動畫軸向：`top` 過渡高度，`left`／`right` 過渡寬度。

自訂工具使用統一 icon descriptor：

```js
tools: [{
  iconCls: 'icon-search',
  title: '搜尋',
  ariaLabel: '搜尋',
  text: '',
  onClick: function(event, panel) {}
}]
```

## Methods

| Method | 說明 |
| --- | --- |
| `panel()` / `header()` / `body()` / `footer()` | 取得對應 DOM element。 |
| `open(force?)` / `close(force?)` | 開啟或關閉。 |
| `destroy(force?)` / `dispose(force?)` | 銷毀並還原原 host。 |
| `clear()` | 清除 body。 |
| `refresh(href?)` | 重新載入 `href`；完成 Promise 位於 `loadPromise`。 |
| `resize(options)` | 更新 width、height、min/max size、left、top。 |
| `move({ left, top })` | 移動 Panel。 |
| `doLayout()` | 通知 body 內已註冊 Control refresh／resize。 |
| `maximize()` / `minimize()` / `restore()` | 切換 Panel 顯示狀態。 |
| `collapse()` / `expand()` | 收合或展開 body。 |
| `setTitle(title)` | 更新標題。 |
| `setContent(content)` | 更新 body HTML 或 HTMLElement。 |
| `setTheme(theme)` / `setLocale(locale, messages?)` | 更新相容 theme 狀態或語系；`setTheme()` 不切換 CSS。 |
| `on(name, handler)` / `off(name, handler?)` | 管理 native lifecycle listener。 |
| `isOpen()` | Panel 是否開啟且未最小化。 |

## Events

Constructor callback 使用 `(panel, eventArgs)`：

- `onBeforeLoad`、`onLoad`、`onLoadError`
- `onBeforeOpen`、`onOpen`
- `onBeforeClose`、`onClose`
- `onBeforeDestroy`、`onDestroy`
- `onBeforeCollapse`、`onCollapse`
- `onBeforeExpand`、`onExpand`
- `onResize`、`onMove`
- `onMaximize`、`onRestore`、`onMinimize`

`onBefore*` callback 或 `before*` listener 回傳 `false` 可取消操作。
