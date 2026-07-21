# fabui.Accordion API

`fabui.Accordion` 是 FabUI core 內建的 pure JavaScript 摺疊面板集合。API 與視覺參考 jQuery EasyUI Accordion，但不依賴 jQuery 或 EasyUI runtime。每個 pane 都直接建立既有 `fabui.Panel`；Accordion 只管理集合、展開狀態、排列、尺寸與鍵盤，不複製 Panel renderer、遠端 loader 或 lifecycle。

既有 16 組主題的容器、一般 header、selected header、文字與 `accordion_arrows.png` 均對應本機 EasyUI theme 參考；`mono` 沿用 Default 結構並套用單色 SVG icon。收合狀態顯示 expand 箭頭，展開狀態顯示 collapse 箭頭。正式 source 與 build 使用 `src/theme/<theme>/images/`，不依賴 `res/`。

## 建立 Accordion

```html
<div id="accordion" style="width:500px;height:300px">
  <div title="關於" data-icon-cls="icon-ok">
    <p>關於內容</p>
  </div>
  <div title="說明" data-selected="true">
    <p>說明內容</p>
  </div>
  <div title="遠端內容" data-href="./content.html"></div>
</div>

<script>
  var accordion = new fabui.Accordion('#accordion', {
    locale: 'zh-TW',
    onSelect: function(title, index, panel) {
      console.log(title, index, panel);
    }
  });
</script>
```

Markup pane 可使用 `title`／`data-title`、`iconCls`／`data-icon-cls`、`selected`／`data-selected`、`collapsible`／`data-collapsible`、`href`／`data-href`、`cache`／`data-cache` 與 `titleDirection`／`data-title-direction`。常用 scalar 值也可寫在 EasyUI 風格 `data-options`；function 與 tool descriptors 請改由 JavaScript options 傳入。

建立後可用 `fabui.Control.getControl(host)` 或 `fabui.Accordion.getControl(host)` 取得 instance。

## Accordion options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `width` / `height` | `'auto'` / `'auto'` | 數字使用 px，也可傳 CSS 尺寸字串。 |
| `fit` | `false` | 填滿父容器。 |
| `border` | `true` | 顯示 Accordion 外框。 |
| `animate` | `true` | 展開／收合時同步執行 Panel 尺寸、Accordion flex 比例、內容透明度與 header 色彩過渡動畫。 |
| `animationDuration` | `180` | 動畫時間，單位為毫秒；遵守 `prefers-reduced-motion`。 |
| `multiple` | `false` | 允許同時展開多個 panes。 |
| `selected` | `0` | 初始展開 pane index。 |
| `halign` | `'top'` | Header 排列：`top`、`left`、`right`。 |
| `panels` | `[]` | 以 options 建立的初始 panes。 |
| `cls` | `''` | Accordion host 自訂 class。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`；含繁簡別名正規化。 |
| `theme` | `'inherit'` | 繼承最近的 `fg-theme-*`，或指定 19 組內建 theme。 |

## Pane options

Pane options 會傳給共用 `fabui.Panel`，並增加以下 Accordion 設定：

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `title` | locale 未命名文字 | Pane header 標題。 |
| `content` | `null` | HTML 字串或 HTMLElement。 |
| `selected` | `false` | 初始或新增後是否展開；`add()` 未指定時預設展開。 |
| `collapsible` | `true` | `false` 時使用者不可由 header 展開／收合。 |
| `index` | 最後 | `add()` 插入位置。 |
| `href` | `null` | 第一次展開時由 Panel 延遲載入。 |

`iconCls`、`tools`、`footer`、`cache`、`method`、`queryParams`、`loader`、`extractor`、`titleDirection`、`onBeforeLoad`／`onLoad`、`onBeforeCollapse`／`onCollapse`、`onBeforeExpand`／`onExpand` 等其餘內容與 lifecycle options 均沿用 [Panel API](./panel-api.md)。Accordion 會固定管理 Panel 的 `halign`、`collapsible` tool、尺寸與收合狀態；header 右側使用 Accordion 專用箭頭，其他 custom tools 保留。

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 Accordion options。 |
| `panels()` / `getPanels()` | 取得全部 `fabui.Panel` instances。 |
| `getPanel(which)` | 依 title、index、Panel 或 pane element 取得 Panel。 |
| `getPanelIndex(panel)` | 取得 Panel index。 |
| `getSelected()` | 取得第一個展開的 Panel；沒有時為 `null`。 |
| `getSelections()` | 取得全部展開的 Panels。 |
| `select(which)` | 展開指定 Panel；單一模式會先收合其他 Panel。 |
| `unselect(which)` | 收合指定 Panel。 |
| `add(options)` | 新增 Panel，回傳 `fabui.Panel` instance。 |
| `remove(which)` | 移除指定 Panel；可由 `onBeforeRemove` 取消。 |
| `resize({ width, height })` | 更新尺寸；也相容 `resize(width, height)`。 |
| `setOptions(options)` | 更新排列、multiple、border、locale、theme 與尺寸。 |
| `setLocale(locale, messages?)` | 切換三語系或覆寫 Accordion ARIA 文字。 |
| `setTheme(theme)` | 切換或重新繼承 theme，並同步全部 Panels。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除集合事件。 |
| `destroy()` / `dispose()` | 解除事件與 registry，銷毀 nested Panels 並還原原始 markup。 |

所有 setter methods 都回傳 Accordion instance。

## Events

Options callbacks 延用 EasyUI 的主要參數順序：

| Callback | 參數 |
| --- | --- |
| `onSelect` / `onUnselect` | `title, index, panel`。 |
| `onAdd` | `title, index, panel`。 |
| `onBeforeRemove` | `title, index, panel`；回傳 `false` 取消。 |
| `onRemove` | `title, index`。 |

`on(name, listener)` 對應 `select`、`unselect`、`add` 與 `remove`，listener 會收到包含 `title`、`index`、`panel` 的 event args。

## 鍵盤與 ARIA

- `ArrowUp`／`ArrowLeft`：焦點移至上一個 header。
- `ArrowDown`／`ArrowRight`：焦點移至下一個 header。
- `Home`／`End`：焦點移至第一個／最後一個 header。
- `Enter`／`Space`：展開或收合目前 header。

Header 公開 `role="button"`、`aria-expanded`、`aria-controls` 與 `aria-disabled`；body 公開 `role="region"` 與 `aria-labelledby`。
