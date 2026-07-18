# FabUI PivotWorkspace API

`fabui.pivot.PivotWorkspace` 是 PivotPanel、PivotGrid、PivotChart 的組合元件。它建立或接收一個共用 PivotEngine，並直接重用三個既有元件，不複製欄位設定、彙總、Grid rendering 或 Chart rendering 邏輯。

## 建立 Workspace

可以直接傳入原始資料與 PivotEngine options：

```js
var workspace = new fabui.pivot.PivotWorkspace('#pivotWorkspace', {
  itemsSource: rows,
  fields: [
    { key: 'quarter', binding: 'date', header: '季度', dataType: 'date', groupBy: 'Quarter' },
    { key: 'region', binding: 'region', header: '區域' },
    { key: 'product', binding: 'product', header: '產品' },
    { key: 'sales', binding: 'sales', header: '銷售額', dataType: 'number', aggregate: 'Sum' }
  ],
  rowFields: ['quarter', 'region'],
  columnFields: ['product'],
  valueFields: ['sales'],
  locale: 'zh-TW',
  gridTitle: '銷售分析',
  gridOptions: {
    rowHeight: 31,
    collapsibleSubtotals: true
  },
  chartOptions: {
    chartType: 'Column',
    showTitle: false
  }
});
```

也可以傳入既有 PivotEngine：

```js
var workspace = new fabui.pivot.PivotWorkspace('#pivotWorkspace', {
  engine: engine,
  panelOptions: {},
  gridOptions: {},
  chartOptions: {}
});
```

Workspace 會將相同 Engine 傳給三個子元件，PivotChart 的 `selectionSource` 會自動指向 Workspace 內的 PivotGrid。

Workspace 監聽 Engine 的 `updatingView`、`progress`、`updatedView` 與 `error`；執行 `refreshAsync()` 時會在 PivotGrid 標題列顯示進度與取消按鈕，錯誤時保留上一版完整 View 並顯示錯誤狀態。

## 公開子元件

```js
workspace.engine;
workspace.panel;
workspace.grid;
workspace.chart;
```

這些都是既有類別的 instance，可直接使用原本的 API：

```js
workspace.panel.viewDefinition;
workspace.grid.collapseAll();
workspace.chart.setType('Pie');
```

## 自適應排列

`layout` 支援：

- `Auto`：預設；容器寬度大於等於 `compactBreakpoint` 時為三欄，較窄時改為三列。
- `Horizontal`：固定三欄。
- `Vertical`：固定三列。

自適應依 Workspace host 寬度判斷，不依整個瀏覽器 viewport，因此放在側欄、Dialog 或其他容器時仍可正確切換。

```js
workspace.layout = 'Vertical';
workspace.layout = 'Auto';
workspace.resize();
```

## Splitter

Panel／Grid 與 Grid／Chart 之間各有一條 `role="separator"` 分隔線：

- 滑鼠或觸控拖曳可調整 Pane 大小。
- Horizontal 使用左右方向鍵。
- Vertical 使用上下方向鍵。
- 拖曳期間才綁定 document pointer listener，結束、取消或 `dispose()` 時立即解除。
- 尺寸受 Panel、Grid、Chart 的最小尺寸限制，Grid 會保留可用空間。

## Options

| Option | 預設值 | 說明 |
|---|---:|---|
| `itemsSource` | `[]` | 原始資料 Array，或既有 PivotEngine。 |
| `engine` | `null` | 優先使用的既有 PivotEngine。 |
| `engineOptions` | `{}` | 建立內部 PivotEngine 時附加的 options。 |
| `panelOptions` | `{}` | 傳給 PivotPanel 的 options。 |
| `gridOptions` | `{}` | 傳給 PivotGrid 的 options。 |
| `chartOptions` | `{}` | 傳給 PivotChart 的 options。 |
| `locale` | `en` | Workspace 與三個子元件的語系。 |
| `messages` | `null` | 自訂 locale messages。 |
| `layout` | `Auto` | `Auto`、`Horizontal`、`Vertical`。 |
| `compactBreakpoint` | `1050` | Auto 切換為 Vertical 的 host 寬度界線。 |
| `panelSize` | `300` | Horizontal Panel 初始寬度。 |
| `chartSize` | `'40%'` | Horizontal Chart 初始寬度；接受 px 數字、百分比或 `fr`。 |
| `verticalPanelSize` | `190` | Vertical Panel 初始高度。 |
| `verticalChartSize` | `190` | Vertical Chart 初始高度。 |
| `minPanelSize` | `220` | Horizontal Panel 最小寬度。 |
| `minGridSize` | `320` | Horizontal Grid 最小寬度。 |
| `minChartSize` | `240` | Horizontal Chart 最小寬度。 |
| `minVerticalPanelSize` | `120` | Vertical Panel 最小高度。 |
| `minVerticalGridSize` | `180` | Vertical Grid 最小高度。 |
| `minVerticalChartSize` | `120` | Vertical Chart 最小高度。 |
| `splitterSize` | `7` | Splitter hit area 尺寸。 |
| `splitterStep` | `16` | 鍵盤每次調整的像素數。 |
| `showPanel` | `true` | 是否顯示 PivotPanel Pane。 |
| `showChart` | `true` | 是否顯示 PivotChart Pane。 |
| `showHeaders` | `true` | 是否顯示三個 Pane 標題。 |
| `showControls` | `true` | 是否顯示 Grid 標題列的 Pane／全螢幕按鈕及 Chart 標題列的圖形／全螢幕控制。 |
| `panelTitle` | locale | 自訂 Panel 標題。 |
| `gridTitle` | locale | 自訂 Grid 標題。 |
| `chartTitle` | locale | 自訂 Chart 標題。 |
| `layoutChanged` | `null` | 排列方向改變後的 callback。 |
| `paneSizeChanged` | `null` | Splitter 操作完成後的 callback。 |

`engineOptions.asyncBatchSize` 可設定非同步彙總的預設批次大小。

建立內部 PivotEngine 時，下列 Workspace 頂層 options 也會直接轉交 Engine：

| Option | 說明 |
| --- | --- |
| `fields` | PivotField definitions。 |
| `rowFields` / `columnFields` / `valueFields` / `filterFields` | 四個 View 區域的欄位 references。 |
| `showRowTotals` / `showColumnTotals` | 列／欄小計與總計顯示模式。 |
| `totalsBeforeData` | 是否將 totals 放在資料前。 |
| `showZeros` | 無 aggregate value 時是否顯示 `0`。 |
| `autoGenerateFields` | 未提供 fields 時是否自動建立欄位。 |
| `asyncBatchSize` | `refreshAsync()` 預設批次大小；也可放在 `engineOptions`。 |

`chartSize` 支援三種表示方式：

```js
chartSize: 350    // Fixed 350px
chartSize: '40%'  // 40% of the Grid + Chart area
chartSize: '1fr'  // Equal to the implicit Grid 1fr
chartSize: '2fr'  // Chart gets two parts, Grid gets one part
```

百分比與 `fr` 的基準是扣除可見 PivotPanel 與 Splitter 後，PivotGrid＋PivotChart 的可分配寬度。`minGridSize` 與 `minChartSize` 仍具有優先權。使用者拖曳 Chart Splitter 後，`chartSize` 會轉為當下的固定 px，確保拖曳結果不會被下一次 resize 重設。

## Properties

| Property | 說明 |
|---|---|
| `engine` | 共用 PivotEngine；可指定另一個 Engine。 |
| `itemsSource` | 目前 Engine 的原始資料 Array；可指定 Array 或 PivotEngine。 |
| `panel` | 內部 PivotPanel instance。 |
| `grid` | 內部 PivotGrid instance。 |
| `chart` | 內部 PivotChart instance。 |
| `layout` | 目前實際排列方向；setter 可指定 Auto／Horizontal／Vertical。 |
| `showPanel` | PivotPanel Pane 顯示狀態。 |
| `showChart` | PivotChart Pane 顯示狀態。 |
| `panelSize` | 目前方向的 Panel 尺寸。 |
| `chartSize` | 目前方向的 Chart 實際像素尺寸；setter 接受 px、百分比或 `fr`。 |
| `chartType` | 目前圖形類型；可指定 `Column`、`Bar`、`Line` 或 `Pie`。 |

## Methods

| Method | 說明 |
|---|---|
| `setEngine(engine)` | 切換三個子元件共用的 PivotEngine。 |
| `setItemsSource(rowsOrEngine)` | 更新原始資料或切換 Engine。 |
| `setLocale(locale, messages?)` | 同步切換 Workspace 與三個子元件語系。 |
| `refreshAsync(options?)` | 轉交 Engine 非同步分批彙總並回傳 Promise。 |
| `cancelRefresh()` | 取消目前非同步彙總。 |
| `setPanelVisible(visible)` | 顯示或隱藏 PivotPanel Pane。 |
| `setChartVisible(visible)` | 顯示或隱藏 PivotChart Pane。 |
| `setChartType(type)` | 切換 PivotChart 圖形類型並同步內建圖形選單。 |
| `isPaneFullscreen(name)` | 檢查 `grid` 或 `chart` Pane 是否正在全螢幕。 |
| `isPaneFullscreenAvailable(name)` | 檢查 `grid` 或 `chart` Pane 是否支援全螢幕。 |
| `togglePaneFullscreen(name)` | 切換完整 Grid／Chart Pane 全螢幕，包含標題列與內容。 |
| `setPaneSizes(panelSize, chartSize)` | 設定目前方向的 Pane 尺寸。 |
| `resize()` | 重新判斷 Auto layout、限制尺寸並刷新 Grid／Chart。 |
| `dispose()` | 解除 ResizeObserver、pointer listener、子元件與 Control registry。 |

## Demo

- Source mode：`demo/dev-pivot-workspace.html`
- Build mode：`demo/pivot-workspace.html`

兩個 Demo 都使用單一 `100dvh` 工作區，頁面本身不產生捲軸；資料捲動留在各 Pane 內。

PivotWorkspace 預設在 PivotGrid 標題列提供「顯示／隱藏定義」、「顯示／隱藏圖表」及 Grid 全螢幕按鈕，並在 PivotChart 標題列提供多語系 Column／Bar／Line／Pie 圖形選單及 Chart 全螢幕按鈕。全螢幕包含 Pane 標題列與內容，可再次按鈕或按 `Escape` 離開；瀏覽器未提供 Fullscreen API 時會自動使用固定定位的全畫面 fallback。Demo 不需要另外建立或同步這些控制項。
