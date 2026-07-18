# FabUI Chart API

`fabui.Chart` 是主 bundle 內建的 pure JavaScript SVG 圖表元件。API 採用 Wijmo FlexChart／FlexPie 常見的資料綁定模型，範圍限定為 `Column`、`Bar`、`Line`、`Pie`。

Pivot view 請使用 [`fabui.pivot.PivotChart`](./pivotchart-api.md)；它會把 PivotEngine view 轉成此 Chart 的 categories 與 series，不會重新彙總原始資料。

```js
const chart = new fabui.Chart('#chart', {
  chartType: 'Column',
  header: '每月營收',
  itemsSource: [
    { month: '1月', sales: 120 },
    { month: '2月', sales: 180 }
  ],
  bindingX: 'month',
  series: [{ name: '營收', binding: 'sales' }]
});
```

圓餅圖使用 `bindingName` 與 `binding`：

```js
new fabui.Chart('#pie', {
  chartType: 'Pie',
  itemsSource: [{ name: 'A', value: 42 }, { name: 'B', value: 58 }],
  bindingName: 'name',
  binding: 'value'
});
```

## 靜態 API

| API | 說明 |
| --- | --- |
| `fabui.Chart.ChartType` | `Column`、`Bar`、`Line`、`Pie` 圖形類型常數。 |
| `fabui.Chart.SelectionMode` | `None`、`Point`、`Series` 選取模式常數。 |
| `fabui.Chart.locales` | Chart 內建 locale registry。 |

## 屬性與選項

| 名稱 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `chartType` | `string` | `Column` | 圖表類型：`Column`、`Bar`、`Line`、`Pie`。 |
| `itemsSource` | `Array` | `null` | Chart 資料來源，可與 FabGrid 共用同一個陣列參照。 |
| `bindingX` | `string` | `''` | Cartesian Chart 的 X 軸／分類欄位 binding。 |
| `bindingName` | `string` | `''` | Pie slice 名稱欄位 binding。 |
| `binding` | `string` | `''` | Pie slice 數值欄位 binding。 |
| `series` | `Array` | `[]` | Cartesian series 定義；每項通常包含 `name` 與 `binding`。 |
| `header` | `string` | `''` | Chart 上方標題。 |
| `footer` | `string` | `''` | Chart 下方說明文字。 |
| `axisX` | `object` | `{}` | X 軸設定。 |
| `axisY` | `object` | `{}` | Y 軸設定，支援 `min`、`max`。 |
| `legend` | `boolean\|object` | `true` | Legend 設定；`position` 支援 `Top`、`Right`、`Bottom`、`Left`、`None`。 |
| `tooltip` | `boolean\|object` | `true` | Tooltip 設定；`content` 可使用模板字串或 function。 |
| `padding` | `number` | `16` | SVG plot area 與 Chart 邊界的內距，單位為 px。 |
| `palette` | `string[]` | `null` | 自訂系列配色；未設定時使用內建半透明柔和 palette。 |
| `selectionMode` | `string` | `None` | 選取模式：`None`、`Point`、`Series`。 |
| `selection` | `object\|null` | `null` | 目前 selection，包含 `pointIndex` 與 `seriesIndex`。 |
| `selectedIndex` | `number` | `-1` | 目前選取的資料 point index。 |
| `selectionSource` | `FabGrid\|null` | `null` | 可選的 Grid selection 來源；設定後自動雙向同步選取。 |
| `selectedItemPosition` | `string` | `Top` | Pie selected slice 位置：`Top`、`Right`、`Bottom`、`Left`、`None`。 |
| `selectedItemOffset` | `number` | `.1` | Pie selected slice 離開圓心的距離，以半徑比例表示。 |
| `isAnimated` | `boolean` | `true` | 是否播放 Pie selection 旋轉動畫。 |
| `animation` | `boolean` | `true` | 是否播放 Chart 顯示與 refresh 動畫。 |
| `dataLabel` | `object\|null` | `null` | Pie 資料文字；支援 `content` 與 `position`。 |
| `observeData` | `boolean` | `true` | 是否偵測綁定資料內容變動並自動 refresh。 |
| `dataRefreshInterval` | `number` | `120` | 資料變動偵測間隔，單位為毫秒。 |
| `locale` | `string` | `en` | Chart locale：`en`、`zh-TW`、`zh-CN`。 |
| `formatValue` | `function\|null` | `null` | 自訂數值格式化 function。 |
| `formatTooltip` | `function\|null` | `null` | 自訂 Tooltip 格式化 function。 |
| `emptyText` | `string\|null` | `null` | 沒有資料時顯示的文字。 |

## 方法

| 方法 | 參數 | 回傳值 | 說明 |
| --- | --- | --- | --- |
| `setItemsSource(itemsSource)` | `Array` | `Chart` | 更換資料來源並 refresh。 |
| `setType(type)` | `string` | `Chart` | 切換 `Column`、`Bar`、`Line` 或 `Pie`。 |
| `setOptions(options)` | `object` | `Chart` | 合併 Chart 選項並 refresh；可用來更換 `selectionSource`。 |
| `setSeries(series)` | `Array` | `Chart` | 更換 series 定義並 refresh。 |
| `setData(data)` | `object` | `Chart` | 更新相容格式的 `categories` 與 `series`。 |
| `selectPoint(index, seriesIndex)` | `number, number?` | `Chart` | 選取指定資料 point；Pie 會依設定旋轉並位移。 |
| `invalidate()` | 無 | 無 | 透過 `requestAnimationFrame` 排程重繪。 |
| `resize()` | 無 | `Chart` | 依目前容器尺寸重新繪製。 |
| `refresh()` | 無 | `Chart` | 立即重新繪製 Chart。 |
| `on(name, handler)` | `string, function` | `Chart` | 訂閱 Chart 事件。 |
| `off(name, handler)` | `string, function` | `Chart` | 移除 Chart 事件 handler。 |
| `bindSelectionSource(source)` | `FabGrid\|null` | `Chart` | 綁定可選的 Grid selection 來源。 |
| `unbindSelectionSource()` | 無 | `Chart` | 解除目前 selection source listener。 |
| `dispose()` | 無 | 無 | 移除 observer、listener、排程與 Chart DOM。 |

## 事件

| 事件 | 事件參數 | 觸發時機 |
| --- | --- | --- |
| `rendering` | `{ chart }` | Chart 開始繪製 SVG 前。 |
| `rendered` | `{ chart }` | Chart、legend、footer 與 selection 繪製完成後。 |
| `selectionChanged` | `{ chart, selection }` | 使用者點擊 Chart mark 並變更 selection 時。 |

相容層仍接受原有的 `type`、`title`、`categories`、`colors` 與 `series[].data`。

`observeData` 預設為 `true`，Chart 會偵測綁定欄位的內容變動並自動刷新；`dataRefreshInterval` 預設為 120ms。首次顯示及每次 `refresh()` 預設播放動畫，可用 `animation: false` 關閉。

預設 palette 採用柔和的八色 RGBA 配色，透明度為 `.72`。明確傳入 `palette` 或相容屬性 `colors` 時，Chart 會原樣使用自訂色彩。

Pie 可用 `selectedItemPosition` 指定選取 slice 旋轉至 `Top`、`Right`、`Bottom`、`Left` 或 `None`；`selectedItemOffset` 使用相對於半徑的比例，預設 `.1`；`isAnimated` 控制選取時是否平滑旋轉。

Pie `dataLabel` 支援 `{name}`、`{value}`、`{percent}` 模板或 `content(data)` function，`position` 可設為 `Inside` 或 `Outside`。未設定時不顯示資料文字。

`selectionSource` 預設為 `null`。傳入 FabGrid instance 後，Chart 會自動同步 Grid row selection，並在點擊 Chart point 時反向選取 Grid；更換來源或 `dispose()` 時會解除 listener。
