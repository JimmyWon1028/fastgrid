# FabUI Chart API

`fabui.Chart` 是主 bundle 內建的 pure JavaScript SVG 圖表元件。API 採用 Wijmo FlexChart／FlexPie 常見的資料綁定模型，範圍限定為 `Column`、`Bar`、`Line`、`Pie`。

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

主要選項／屬性：`chartType`、`itemsSource`、`bindingX`、`bindingName`、`binding`、`series`、`header`、`footer`、`axisX`、`axisY`、`legend`、`tooltip`、`palette`、`selectionMode`、`selection`、`selectedIndex`、`selectionSource`、`selectedItemPosition`、`selectedItemOffset`、`isAnimated`、`animation`、`observeData`、`dataRefreshInterval`。

方法：`setItemsSource()`、`setType()`、`setOptions()`、`setSeries()`、`setData()`、`selectPoint()`、`invalidate()`、`resize()`、`refresh()`、`on()`、`off()`、`dispose()`。

事件：`rendering`、`rendered`、`selectionChanged`。

相容層仍接受原有的 `type`、`title`、`categories`、`colors` 與 `series[].data`。

`observeData` 預設為 `true`，Chart 會偵測綁定欄位的內容變動並自動刷新；`dataRefreshInterval` 預設為 120ms。首次顯示及每次 `refresh()` 預設播放動畫，可用 `animation: false` 關閉。

預設 palette 採用柔和的八色 RGBA 配色，透明度為 `.72`。明確傳入 `palette` 或相容屬性 `colors` 時，Chart 會原樣使用自訂色彩。

Pie 可用 `selectedItemPosition` 指定選取 slice 旋轉至 `Top`、`Right`、`Bottom`、`Left` 或 `None`；`selectedItemOffset` 使用相對於半徑的比例，預設 `.1`；`isAnimated` 控制選取時是否平滑旋轉。

Pie `dataLabel` 支援 `{name}`、`{value}`、`{percent}` 模板或 `content(data)` function，`position` 可設為 `Inside` 或 `Outside`。未設定時不顯示資料文字。

`selectionSource` 預設為 `null`。傳入 FabGrid instance 後，Chart 會自動同步 Grid row selection，並在點擊 Chart point 時反向選取 Grid；更換來源或 `dispose()` 時會解除 listener。
