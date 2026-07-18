# FabUI PivotChart API

`fabui.pivot.PivotChart` 將 `PivotEngine.pivotView` 轉成既有 `fabui.Chart` 的分類與系列。PivotPanel、PivotGrid、PivotChart 應共用同一個 PivotEngine；Rows、Columns、Values、Filters、排序或 aggregate 改變後，PivotChart 會監聽 Engine `updatedView`；PivotGrid 疊合／展開時則監聽 Grid `refreshed`，並在下一個 animation frame 依目前可見彙總重新繪製，不會再次彙總原始資料。

## 建立 PivotChart

```js
var engine = new fabui.pivot.PivotEngine({
  itemsSource: rows,
  fields: [
    { key: 'quarter', binding: 'date', header: '季度', groupBy: 'Quarter' },
    { key: 'platform', binding: 'platform', header: '平台' },
    { key: 'sales', binding: 'sales', header: '銷售額', dataType: 'number', aggregate: 'Sum' }
  ],
  rowFields: ['quarter'],
  columnFields: ['platform'],
  valueFields: ['sales']
});

var chart = new fabui.pivot.PivotChart('#pivotChart', {
  itemsSource: engine,
  locale: 'zh-TW',
  chartType: 'Column',
  showLegend: 'Auto',
  showTotals: false,
  selectionSource: pivotGrid,
  maxPoints: 100,
  maxSeries: 12
});
```

`itemsSource` 可直接傳入 `PivotEngine`，也可傳入已連接該 Engine 的 `PivotPanel`。`engine` property 會回傳實際使用的 PivotEngine。

## Pivot view 對應規則

- row field leaf entries 轉成 X 軸 categories。
- column field leaf entries 與 value fields 組合成 series。
- 多個 value fields 時，series 名稱使用「column path · value field」格式。
- 預設排除 row／column subtotal 與 grand total，避免重複顯示 aggregate；`showTotals: true` 才納入。
- 未設定 `selectionSource` 時，預設使用完整 PivotEngine view 的 leaf aggregates。
- 設定 `selectionSource` 為共用同一個 PivotEngine 的 PivotGrid 後，展開群組顯示 leaf aggregates；疊合群組改用目前可見 subtotal，並排除該群組已隱藏的明細。
- Pie 使用 `selectedSeries` 指定單一 series，該 series 的 row categories 會轉成 slices。
- Pie 預設可點擊選取；選取後沿用 `fabui.Chart` 的旋轉與扇形位移動畫。
- Pie 預設在扇形內顯示百分比，可用 `dataLabel: null` 關閉。
- 設定 `selectionSource` 為共用同一個 PivotEngine 的 PivotGrid 後，點擊圖形會選取並捲動到對應的彙總 cell；點擊 PivotGrid 彙總 cell 也會反向標記圖形。Pie 會同步切換到對應的 `selectedSeries`。
- `maxPoints` 與 `maxSeries` 只限制圖表繪製量，不修改 PivotEngine view。

## Options 與 properties

| 名稱 | 預設值 | 說明 |
|---|---:|---|
| `itemsSource`／`engine` | `null` | 共用的 PivotEngine 或 PivotPanel。 |
| `chartType` | `Column` | `Column`、`Bar`、`Line`、`Pie`。 |
| `showTitle` | `true` | 是否顯示 Chart 內標題。 |
| `header` | 空字串 | 自訂標題；未提供時使用 locale 的 Pivot Chart 標題。 |
| `showLegend` | `Auto` | `Auto`、`Always`、`Never` 或 boolean。 |
| `legendPosition` | `Bottom` | `Top`、`Right`、`Bottom`、`Left`。 |
| `showTotals` | `false` | 是否納入 subtotal 與 grand total。 |
| `maxPoints` | `100` | 最多顯示的 categories 數量。 |
| `maxSeries` | `12` | 最多顯示的 series 數量。 |
| `selectedSeries` | `0` | Pie 使用的 series index。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `messages` | `null` | 覆寫 locale 文字。 |
| `footer` | 空字串 | Chart footer；超過上限時會附加截斷訊息。 |
| `tooltip` | `true` | 沿用 `fabui.Chart` tooltip 設定。 |
| `palette` | `null` | 自訂顏色陣列。 |
| `animation` | `true` | 是否播放 Chart refresh 動畫。 |
| `dataLabel` | `{ content: '{percent}%', position: 'Inside' }` | Pie data label 設定；設為 `null` 可關閉。 |
| `selectionMode` | `Point` | Pie 點擊選取模式；設為 `None` 可停用。 |
| `selectionSource` | `null` | 與圖形 point 雙向同步選取，並提供目前疊合／展開可見資料的 PivotGrid。 |
| `selectedItemPosition` | `Top` | Pie 選取扇形旋轉後的位置。 |
| `selectedItemOffset` | `.1` | Pie 選取扇形相對半徑的位移比例。 |
| `isAnimated` | `true` | 是否播放 Pie 選取旋轉動畫。 |
| `axisX`／`axisY` | `{}` | Cartesian 軸設定。 |
| `formatValue` | `null` | 數值格式化 function。 |
| `formatTooltip` | `null` | Tooltip 格式化 function。 |
| `emptyText` | `null` | 沒有可繪製資料時顯示的文字；未設定時使用 locale。 |

唯讀 `chart` property 是內部的 `fabui.Chart` instance；可用於進階 Chart 設定，但 Pivot view 的資料更新仍應由 PivotChart 管理。

`fabui.pivot.PivotChart.ChartType` 直接沿用 `fabui.Chart.ChartType`，提供 `Column`、`Bar`、`Line`、`Pie` 常數。

## Methods

| 方法 | 說明 |
|---|---|
| `setItemsSource(engineOrPanel)` | 切換共用 PivotEngine，並解除舊 Engine listener。 |
| `bindSelectionSource(pivotGridOrNull)` | 設定或解除與 PivotGrid 的雙向選取連動。 |
| `setOptions(options)` | 合併選項並刷新。 |
| `setType(type)` | 切換 Column、Bar、Line 或 Pie。 |
| `setLocale(locale, messages?)` | 套用 locale 與可選自訂文字。 |
| `refresh()` | 立即由目前 Pivot view 重建 Chart model。 |
| `invalidate()` | 合併排程下一次 refresh。 |
| `resize()` | 依目前容器尺寸重新繪製內部 Chart。 |
| `dispose()` | 解除 PivotEngine listener、Chart ResizeObserver、Control registry 與 DOM。 |

## Lifecycle 與效能

PivotChart 繼承 `fabui.Control`，建立時可由 `fabui.Control.getControl(host)` 取得，`dispose()` 後解除。內部 Chart 使用 `observeData: false`，由 PivotEngine `updatedView` 與已綁定 PivotGrid 的 `refreshed` 事件驅動，不使用定時輪詢；連續更新會合併到單一 animation frame。

Source-mode 範例位於 `demo/dev-pivot.html`。桌面版將 PivotChart 放在 PivotGrid 右側，窄畫面改為上下排列；隱藏圖表後 PivotGrid 會擴展，重新顯示時呼叫 `resize()`。
