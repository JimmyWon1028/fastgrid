# fabui.Tabs API

`fabui.Tabs` 是 FabUI core 內建的 pure JavaScript 頁籤元件。API 與 Default 視覺參考 jQuery EasyUI Tabs，但不依賴 jQuery 或 EasyUI runtime。它一次只顯示一個 tab panel，支援動態新增／關閉、tab tools、header tools、頁籤拖曳排序、四方向排列、overflow scroller、遠端內容、鍵盤與 19 組 FabUI theme。

## 建立 Tabs

```html
<div id="tabs">
  <div title="首頁">首頁內容</div>
  <div title="報表" data-closable="true" data-icon-cls="icon-excel">
    報表內容
  </div>
</div>

<script>
  var tabs = new fabui.Tabs('#tabs', {
    width: 700,
    height: 300,
    onSelect: function(title, index) {
      console.log(title, index);
    }
  });
</script>
```

Markup 可使用 `title`、`closable`／`data-closable`、`disabled`／`data-disabled`、`selected`／`data-selected`、`iconCls`／`data-icon-cls`、`href`／`data-href` 與 `tools`／`data-tools`。

## Options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `width` / `height` | `'auto'` / `'auto'` | 數字使用 px，也可傳 CSS 尺寸字串。 |
| `fit` | `false` | 填滿父容器。 |
| `border` | `true` | 顯示 header 與 panels 外框。 |
| `plain` | `false` | 移除 header 背景容器。 |
| `scrollIncrement` | `100` | 每次點擊 scroller 移動的 px。 |
| `scrollDuration` | `400` | 大於 `0` 時使用平滑捲動。 |
| `tools` | `[]` | Header 工具 descriptor array 或外部容器 selector。 |
| `toolPosition` | `'right'` | `left`、`right`、`top`、`bottom`。 |
| `tabPosition` | `'top'` | `top`、`bottom`、`left`、`right`。 |
| `headerWidth` | `150` | 左／右排列時的 header 寬度。 |
| `tabWidth` | `'auto'` | 全部 tab strip 的預設寬度。 |
| `tabHeight` | `28` | tab strip 高度。 |
| `selected` | `0` | 初始選取 index。 |
| `showHeader` | `true` | 是否顯示 header。 |
| `justified` | `false` | 所有 tab 平均填滿 header。 |
| `narrow` | `false` | 移除 tab 間距。 |
| `pill` | `false` | 使用 pill 樣式。 |
| `draggable` | `false` | 允許拖曳 `top`／`bottom` 頁籤排序。只有標題文字是 drag handle；其他位置不會觸發拖曳。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `cls` | `''` | Tabs host 自訂 class。 |
| `tabs` | `[]` | 以 options 動態建立的初始 tab panels。 |

拖曳時會顯示半透明 drag image 與插入線，原位置 Tab 保持不變。`left`／`right` 位置不啟用水平拖曳。

## Tab panel options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `title` | locale 未命名文字 | Tab 標題。 |
| `content` | `null` | HTML 字串或 DOM element。 |
| `href` | `''` | 第一次選取時載入遠端內容。 |
| `cache` | `true` | `false` 時每次選取重新載入。 |
| `method` | `'GET'` | 遠端請求方法。 |
| `iconCls` | `''` | 統一使用 `.icon-xxx` class。 |
| `closable` | `false` | 顯示關閉按鈕。 |
| `selected` | `false` | 新增後是否選取；`add()` 預設選取。 |
| `disabled` | `false` | 停用頁籤。 |
| `index` | 最後 | 插入位置。 |
| `tabWidth` | `null` | 覆寫該頁籤寬度。 |
| `tools` | `[]` | Tab strip mini tools array 或 selector。 |
| `style` | `null` | 套用到 tab panel 的 inline style object。 |

Header tool 與 tab tool descriptor 使用 `{ iconCls, text, title, ariaLabel, handler }` 或 `onClick`。Icon class 必須在 `src/fabui.icon.css` 定義。

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 Tabs options。 |
| `tabs()` / `getTabs()` | 取得全部 tab panel elements。 |
| `resize({ width, height })` | 調整尺寸並重算 overflow。也相容 `resize(width, height)`。 |
| `add(options)` | 新增 tab panel，回傳 panel element。 |
| `close(which)` | 依 title、index 或 panel 關閉，成功回傳 `true`。 |
| `getTab(which)` | 依 title 或 index 取得 panel element。 |
| `getTabOptions(which)` | 取得指定 tab 的 options。 |
| `getTabIndex(tab)` | 取得 panel index。 |
| `getSelected()` | 取得目前 panel；未選取時為 `null`。 |
| `select(which)` | 選取有效 tab。 |
| `unselect(which)` | 取消目前選取。 |
| `exists(which)` | 檢查 title、index 或 panel 是否存在。 |
| `update(which, options)` | 更新 tab header／content／href。 |
| `update({ tab, type, options })` | EasyUI-compatible update 形式；`type` 保留作為相容欄位。 |
| `enableTab(which)` / `disableTab(which)` | 啟用或停用頁籤。 |
| `showHeader()` / `hideHeader()` | 顯示或隱藏 header。 |
| `showTool()` / `hideTool()` | 顯示或隱藏 header tools。 |
| `scrollBy(deltaX)` | 捲動 header；正數向左，負數向右。 |
| `setOptions(options)` | 更新 Tabs options 並重繪。 |
| `setLocale(locale, messages?)` | 切換三語系或覆寫文字。 |
| `setTheme(theme)` | 更新相容 theme 狀態，不載入或切換 CSS。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除事件。 |
| `destroy()` / `dispose()` | 解除事件、Control registry 並還原剩餘 panels。 |

所有 setter methods 都回傳 Tabs instance。Tabs 建立後可用 `fabui.Control.getControl(host)` 或 `fabui.Tabs.getControl(host)` 取得 instance。

## Events

Options callbacks 使用 EasyUI 的主要參數順序：

| Callback | 參數 |
| --- | --- |
| `onBeforeSelect` | `title, index, panel`；回傳 `false` 取消。 |
| `onSelect` / `onUnselect` | `title, index, panel`。 |
| `onBeforeClose` | `title, index, panel`；回傳 `false` 取消。 |
| `onClose` | `title, index`。 |
| `onAdd` / `onUpdate` | `title, index, panel`。 |
| `onLoad` | `panel, title`。 |
| `onContextMenu` | `event, title, index`。 |
| `onReorder` | `title, fromIndex, toIndex, panel`；拖曳排序完成。 |

`on(name, listener)` 對應 `select`、`unselect`、`close`、`add`、`update`、`load`、`contextmenu` 與 `reorder`，listener 會收到包含 `title`、`index`、`tab`、`fromIndex`、`toIndex` 等欄位的 event args。

## 鍵盤

焦點位於 tab strip 時：

- `ArrowLeft`／`ArrowRight`／`ArrowUp`／`ArrowDown`：移至下一個有效頁籤。
- `Home`／`End`：移至第一個／最後一個有效頁籤。
- `Delete`：關閉目前可關閉的頁籤。
