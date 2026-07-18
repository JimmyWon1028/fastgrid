# fabui.Layout API

`fabui.Layout` 是以 `fabui.Panel` 組成的五區 pure JavaScript 版面容器。支援 north、south、east、west、center、拖曳 Splitter、收合區域、動態加入／移除與巢狀 Layout，不依賴 jQuery 或 EasyUI runtime。

## 建立

```html
<div id="layout" style="width:900px;height:600px">
  <div data-region="north" title="North"></div>
  <div data-region="west" title="West"></div>
  <div data-region="center" title="Center"></div>
</div>
```

```js
var layout = new fabui.Layout('#layout', {
  regions: {
    north: { height: 80, split: true },
    west: { width: 220, split: true },
    center: { border: true }
  }
});
```

`center` 是必要區域；其餘四個 edge regions 為選用。每一區都可透過 `layout.panel(region)` 取得 `fabui.Panel` instance。

## Layout options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `width` / `height` | `null` | Layout CSS 尺寸。 |
| `fit` | `false` | 填滿父容器；host 是 `body` 時自動填滿。 |
| `splitSize` | `5` | Splitter 厚度。 |
| `collapseDelay` | `100` | Float region 離開後自動收起的延遲毫秒數。 |
| `animate` | `true` | 收起／展開 edge region 時是否顯示過渡動畫。 |
| `animationDuration` | `180` | 收起／展開動畫時間，單位為毫秒。 |
| `regions` | `null` | 五區 options map。 |
| `theme` | `'inherit'` | 繼承最近的 FabUI Theme 或指定 theme。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`。 |

## Region options

Region options 會傳給共用的 `fabui.Panel`，並增加以下 Layout 設定：

| Option | 預設 | 說明 |
| --- | --- | --- |
| `region` | — | `north`、`south`、`east`、`west`、`center`。 |
| `width` / `height` | — | east／west 使用 width；north／south 使用 height。 |
| `split` | `false` | 顯示可拖曳與鍵盤操作的 Splitter。 |
| `collapsible` | `true` | Edge region 是否可收合。 |
| `collapsed` | `false` | 初始化是否收合。 |
| `minWidth` / `minHeight` | `10` | Splitter 最小尺寸。 |
| `maxWidth` / `maxHeight` | `10000` | Splitter 最大尺寸。 |
| `expandMode` | `'float'` | 收合 bar 點擊行為：`float`、`dock` 或 `null`。 |
| `collapsedSize` | `28` | 收合 bar 尺寸。 |
| `hideExpandTool` | `false` | 隱藏收合 bar 的展開按鈕。 |
| `hideCollapsedContent` | `true` | 隱藏收合 bar 標題。 |
| `collapsedContent` | `''` | 收合 bar 的文字或 `(title) => string`。 |

其餘 `title`、`iconCls`、`border`、`href`、`loader`、`cache`、`tools`、`content` 與 lifecycle options 沿用 [Panel API](./panel-api.md)。

## Methods

| Method | 說明 |
| --- | --- |
| `resize({ width?, height? })` | 更新 Layout 尺寸與五區幾何。 |
| `panel(region)` | 取得指定 `fabui.Panel`，不存在時回傳 `null`。 |
| `collapse(region)` / `expand(region)` | 收合或 dock 展開 edge region。 |
| `add(options)` | 動態加入 region，回傳該 Panel。 |
| `remove(region)` | 移除 edge region。 |
| `split(region)` / `unsplit(region)` | 開啟或關閉 Splitter。 |
| `stopCollapsing()` | 收起目前 float 展開的 region。 |
| `setTheme(theme)` / `setLocale(locale, messages?)` | 更新 Layout 與全部 Panels。 |
| `on(name, handler)` / `off(name, handler?)` | 管理 lifecycle listener。 |
| `destroy()` / `dispose()` | 銷毀 Layout 並還原 region hosts。 |

Splitter 支援 pointer drag；focus Splitter 後可用方向鍵每次調整 10px。Document pointer listeners 只在拖曳期間綁定，結束、取消或 dispose 時立即解除。

收起／展開會同步動畫 edge region、center、Splitter 與 collapsed bar。當作業系統啟用「減少動態效果」時，Layout 會自動停用動畫並立即完成狀態切換。

## Events

Constructor callbacks 使用 `(layout, eventArgs)`：

- `onCollapse` / `onExpand`
- `onAdd` / `onRemove`
- `onResize`
- `onRegionResize`
- `onDestroy`

對應的 native event names 為 `collapse`、`expand`、`add`、`remove`、`resize`、`regionresize`、`destroy`。
