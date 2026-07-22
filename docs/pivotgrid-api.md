# FabUI Pivot API

本手冊涵蓋 `fabui.pivot` namespace 內的 PivotEngine、PivotField、PivotPanel、PivotSlicer 與 PivotGrid。原始資料先交由 PivotEngine 分組彙總，再由 Panel／Slicer 設定分析狀態，最後交給 PivotGrid 顯示多層欄標頭、列欄位、小計、總計與明細資料。

圖表與整合工作區另見 [PivotChart API](./pivotchart-api.md) 與 [PivotWorkspace API](./pivotworkspace-api.md)。

## 建立 PivotEngine

```js
var engine = new fabui.pivot.PivotEngine({
  itemsSource: rows,
  fields: [
    { key: 'region', binding: 'region', header: '區域' },
    { key: 'platform', binding: 'platform', header: '平台' },
    { key: 'sales', binding: 'sales', header: '銷售額', dataType: 'number', aggregate: 'Sum', format: 'n0' }
  ],
  rowFields: ['region'],
  columnFields: ['platform'],
  valueFields: ['sales'],
  showRowTotals: 'Subtotals',
  showColumnTotals: 'GrandTotals'
});
```

欄位 reference 可以使用 `key`、`header`、`binding` 或 `PivotField` instance。若同一 binding 需要不同用途，應指定不同且穩定的 `key`。

### PivotEngine options

| Option | 說明 |
|---|---|
| `itemsSource` | 原始資料 Array。 |
| `fields` | `PivotField` 定義。未提供時可由第一筆資料自動產生。 |
| `autoGenerateFields` | 是否自動產生欄位，預設 `true`。 |
| `rowFields` | 依序建立左側列階層。 |
| `columnFields` | 依序建立上方欄階層。 |
| `valueFields` | 要彙總的 measure 欄位。 |
| `filterFields` | 保存供篩選使用的欄位清單。實際條件設於 `PivotField.filter`。 |
| `showRowTotals` | `None`、`GrandTotals`、`Subtotals`。 |
| `showColumnTotals` | `None`、`GrandTotals`、`Subtotals`。 |
| `totalsBeforeData` | `true` 時將小計／總計放在資料前。 |
| `showZeros` | 沒有 aggregate value 時是否顯示 `0`。 |
| `asyncBatchSize` | `refreshAsync()` 每批處理筆數，預設 `1000`。 |

### PivotField

| Property | 說明 |
|---|---|
| `key` | 欄位穩定識別值。 |
| `binding` | 原始資料 property path。 |
| `header` | 顯示名稱。 |
| `dataType` | `string`、`number`、`date`、`boolean`。 |
| `aggregate` | `Sum`、`Count`、`Average`、`WeightedAverage`、`Min`、`Max`；Average 只計入可轉為數字的非空值。 |
| `format` | `n0`、`n2`、`p0`、`c2` 等顯示格式。 |
| `sortDirection` | Dimension 排序狀態：`0` 預設順序、`1` 升冪、`-1` 降冪。 |
| `descending` | 向下相容屬性；指定 `true` 為降冪，`false` 為升冪。 |
| `filter` | Function、允許值 Array，或 `{ values, predicate }`。 |
| `groupBy` | `Year`、`Quarter`、`Month`、`Day` 或 Function。 |
| `getValue`／`calculate` | 自訂原始值 getter；calculated field 可不提供 binding。Function 不會寫入 JSON `viewDefinition`。 |
| `weightBinding`／`getWeight` | `WeightedAverage` 使用的權重 property path 或 getter。 |
| `showAs` | `PivotShowAs` 值，將完成的 aggregate 轉為百分比、差異或累計。 |
| `width`、`align` | PivotGrid 欄寬與對齊。 |
| `visible` | 是否顯示欄位，預設 `true`。 |

### Aggregate 列舉

```js
fabui.pivot.PivotAggregate.Sum
fabui.pivot.PivotAggregate.Count
fabui.pivot.PivotAggregate.Average
fabui.pivot.PivotAggregate.WeightedAverage
fabui.pivot.PivotAggregate.Min
fabui.pivot.PivotAggregate.Max
```

### ShowAs 列舉

```js
fabui.pivot.PivotShowAs.NoCalculation
fabui.pivot.PivotShowAs.PercentOfGrandTotal
fabui.pivot.PivotShowAs.PercentOfRowTotal
fabui.pivot.PivotShowAs.PercentOfColumnTotal
fabui.pivot.PivotShowAs.DifferenceFromPrevious
fabui.pivot.PivotShowAs.PercentDifferenceFromPrevious
fabui.pivot.PivotShowAs.RunningTotal
```

百分比 ShowAs 依目前 Pivot view 的 Grand Total／Row Total／Column Total 計算，因此相對應的 totals 必須啟用。建議百分比欄位搭配 `format: 'p0'` 或 `p2`。

### Calculated field、WeightedAverage 與 ShowAs 範例

Calculated field 透過 `getValue` 或相容名稱 `calculate` 從原始 item 計算數值；`WeightedAverage` 可用 `weightBinding` 或 `getWeight` 指定權重：

```js
var engine = new fabui.pivot.PivotEngine({
  itemsSource: rows,
  fields: [
    { key: 'region', binding: 'region', header: '區域' },
    {
      key: 'profit',
      header: '毛利',
      dataType: 'number',
      aggregate: 'Sum',
      getValue: function(item) {
        return Number(item.sales || 0) - Number(item.cost || 0);
      }
    },
    {
      key: 'unitPrice',
      binding: 'unitPrice',
      header: '加權單價',
      dataType: 'number',
      aggregate: 'WeightedAverage',
      weightBinding: 'quantity',
      format: 'n2'
    },
    {
      key: 'salesShare',
      binding: 'sales',
      header: '銷售占比',
      dataType: 'number',
      aggregate: 'Sum',
      showAs: 'PercentOfGrandTotal',
      format: 'p2'
    }
  ],
  rowFields: ['region'],
  valueFields: ['profit', 'unitPrice', 'salesShare']
});
```

`getValue`、`calculate`、`getWeight` 與 Function 型 `groupBy`／`filter` 不會寫入 JSON `viewDefinition`。應用程式還原設定時，應以穩定 field `key` 重新提供這些 Function。

### Totals 列舉

```js
fabui.pivot.PivotShowTotals.None
fabui.pivot.PivotShowTotals.GrandTotals
fabui.pivot.PivotShowTotals.Subtotals
```

### PivotEngine properties

- `itemsSource`
- `fields`
- `rowFields`
- `columnFields`
- `valueFields`
- `filterFields`
- `pivotView`
- `viewDefinition`
- `isUpdating`

`viewDefinition` 是可序列化的 plain object，可用 `JSON.stringify()` 保存，再指定回另一個 PivotEngine。

若 `PivotField.filter` 使用單一允許值，該條件也會包含在 `viewDefinition.fields` 內；Function predicate 不會序列化。`dataType: 'date'` 的允許值經 JSON 轉為 ISO 字串後，還原時仍會依日期值比對，不要求相同的 Date object reference。

### PivotEngine methods

- `setItemsSource(rows)`
- `setFields(definitions)`
- `generateFields()`
- `setViewFields(name, references)`
- `getField(reference)`
- `removeField(reference)`
- `beginUpdate()`
- `endUpdate()`
- `deferUpdate(callback)`
- `refresh()`
- `refreshAsync({ batchSize })`
- `cancelRefresh()`
- `getDetail(row, column)`
- `getKeys(row, column)`
- `formatFieldValue(field, value, locale?)`
- `dispose()`

`setFields(definitions)` 會使用穩定的 field `key`，將既有 Rows、Columns、Values、Filters 重新綁定到新的 `PivotField` instance；已從 definitions 移除的 key 也會自動從 View 區域移除。

`generateFields()` 會依第一筆原始資料重建自動欄位；`formatFieldValue()` 使用欄位型別與指定 locale 將 Pivot 維度值轉為顯示文字。

`refresh()` 保持同步並立即回傳 Pivot view。`refreshAsync()` 以批次讓出主執行緒並回傳 Promise；執行期間透過 `progress` 回報 `{ progress, processed, total, async: true }`。呼叫 `cancelRefresh()`、同步 `refresh()` 或開始另一個非同步工作會取消舊工作；Promise 以 `AbortError` 拒絕，既有完整 `pivotView` 不會被部分結果取代。

`deferUpdate(callback)` 可接受同步或 async callback；期間多次欄位變更只在最外層 callback 完成後重建一次 View。

### PivotEngine events

- `itemsSourceChanged`
- `viewDefinitionChanged`
- `updatingView`
- `progress`
- `updatedView`
- `error`

事件支援兩種形式：

```js
engine.updatedView.addHandler(function(sender, args) {});
engine.on('updatedView', function(args) {});
```

上述事件名稱也可直接作為 PivotEngine constructor callback option，例如 `updatedView(sender, args)` 或 `progress(sender, args)`。

## 建立 PivotPanel

```js
var panel = new fabui.pivot.PivotPanel('#pivotPanel', {
  itemsSource: engine,
  locale: 'zh-TW'
});
```

PivotPanel 與 PivotGrid 綁定同一個 PivotEngine。使用者可以勾選欄位，或以滑鼠／觸控將欄位拖曳到 Filters、Rows、Columns、Values 區域；每次已確認的變更會重建 Pivot view。四個區域的排列以插入橫線標示實際落點，不顯示上下移動按鈕。

Filters chip 的篩選按鈕會開啟搜尋與多值選取 dialog。勾選內容只更新草稿；按「套用」才寫入 `PivotField.filter`，按「取消」、`Escape` 或點擊外部只關閉 dialog。

### PivotPanel options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `itemsSource` / `engine` | `null` | 共用的 `PivotEngine`。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `messages` | `null` | 覆寫 locale 文字。 |
| `restrictDragging` | `false` | 限制 PivotPanel 的欄位拖放。 |

主要互動：

- 勾選一般欄位加入 Rows；勾選 number 欄位加入 Values。
- 拖放欄位可在四個區域之間移動並重新排序。
- Rows、Columns、Values 直接拖曳排序並顯示插入橫線；`×` 從目前區域移除。
- Filters 區只在 chip 上顯示欄位名稱與操作，不放置會壓縮名稱的 inline selector。
- Filter 內容可由 chip 的多值 dialog、PivotGrid 左上角 selector 或共用同一 Engine 的 PivotSlicer 設定。
- Filters 區的欄位會依順序顯示在 PivotGrid 左上角、row field 標頭上方。
- Rows、Columns 欄位可按滑鼠右鍵開啟排序 popup，直接設定預設順序、升冪或降冪；選取後立即更新共用 PivotEngine。
- Values 只顯示完整欄位名稱；在數值欄位上按滑鼠右鍵，可切換 Sum、Count、Average、Min、Max。

### PivotPanel properties

| Property | 說明 |
| --- | --- |
| `itemsSource` / `engine` | 目前共用的 PivotEngine。 |
| `fields` | Engine 全部 PivotField。 |
| `filterFields` / `rowFields` / `columnFields` / `valueFields` | 四個 View 區域的欄位集合。 |
| `isViewDefined` | 是否已有可顯示的 Rows／Columns 與 Values 組合。 |
| `viewDefinition` | JSON 字串；可直接保存或指定回 Panel。 |

### PivotPanel methods

| Method | 說明 |
| --- | --- |
| `setItemsSource(engine)` | 切換共用 PivotEngine。 |
| `setLocale(locale, messages?)` | 切換語系與自訂文字。 |
| `moveField(field, area, index?)` | 將欄位移至 Filters、Rows、Columns 或 Values。 |
| `removeField(field, area?)` | 從指定或目前區域移除欄位。 |
| `setAggregate(field, aggregate)` | 設定 Value field aggregate。 |
| `setShowAs(field, showAs)` | 設定 Value field ShowAs。 |
| `setSortDirection(field, direction)` | 設定 dimension 的預設／升冪／降冪排序。 |
| `showAggregateMenu()` / `hideAggregateMenu()` / `isAggregateMenuOpen()` | Value aggregate／ShowAs popup lifecycle。 |
| `showSortMenu()` / `hideSortMenu()` / `isSortMenuOpen()` | Rows／Columns 排序 popup lifecycle。 |
| `showFilterMenu()` / `applyFilterMenu()` / `hideFilterMenu()` / `isFilterMenuOpen()` | Filter 多值草稿 dialog lifecycle。 |
| `refresh()` | 依目前 Engine 狀態重繪 Panel。 |
| `dispose()` | 解除 Engine、document listener、Control registry 與 DOM。 |

PivotPanel 的排序、aggregate／ShowAs 與 filter popup 都支援 `Escape` 及點擊外部關閉；點擊 popup 內部不會先關閉而阻斷操作。關閉 filter popup 不會套用尚未確認的多值草稿。

## 建立 PivotSlicer

```js
var slicer = new fabui.pivot.PivotSlicer('#regionSlicer', {
  itemsSource: engine,
  field: 'Region',
  locale: 'zh-TW',
  deferApply: true
});
```

PivotSlicer 直接讀取同一 PivotEngine 的原始 Array，提供搜尋、全選、多值草稿、`apply()` 與 `clear()`。公開 `engine`、`field`、`selectedValues`、`setItemsSource()`、`setField()`、`setLocale()`、`refresh()` 與 `dispose()`。`deferApply: false` 可在每次勾選後立即套用。

### PivotSlicer options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `itemsSource` / `engine` | `null` | 共用的 PivotEngine。 |
| `field` | `null` | 要篩選的 field key、binding、header 或 PivotField instance。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `messages` | `null` | 覆寫 locale 文字。 |
| `showSearch` | `true` | 顯示 Slicer 搜尋框。 |
| `deferApply` | `true` | 先保留多選草稿，按套用後才寫入 `PivotField.filter`；設為 `false` 時每次勾選立即套用。 |

### PivotSlicer properties 與 methods

| API | 說明 |
| --- | --- |
| `engine` / `itemsSource` | 目前共用的 PivotEngine，可指定另一個 Engine。 |
| `field` | 目前綁定的 PivotField，可指定另一個 field reference。 |
| `selectedValues` | 目前草稿中選取的 distinct values。 |
| `setItemsSource(engine)` | 切換共用 PivotEngine。 |
| `setField(reference)` | 切換篩選欄位。 |
| `setLocale(locale, messages?)` | 切換語系與自訂文字。 |
| `apply()` | 將選取草稿寫入 PivotField filter 並 refresh Engine。 |
| `clear()` | 清除目前欄位篩選與草稿。 |
| `refresh()` | 重新讀取 distinct values 並重繪。 |
| `dispose()` | 解除 Engine listener、Control registry 與 DOM。 |

PivotPanel 的 `viewDefinition` 使用 JSON 字串，方便直接保存到 `localStorage`：

```js
localStorage.pivotView = panel.viewDefinition;
panel.viewDefinition = localStorage.pivotView;
```

## 建立 PivotGrid

```js
var pivot = new fabui.pivot.PivotGrid('#pivotGrid', {
  itemsSource: engine,
  locale: 'zh-TW',
  collapsibleSubtotals: true,
  showDetailOnDoubleClick: true,
  customContextMenu: true,
  selectionMode: 'CellRange'
});
```

`PivotGrid.itemsSource` 必須是 `fabui.pivot.PivotEngine` instance。`engine` property 會回傳目前連接的 PivotEngine。

### PivotGrid 專用 options

| Option | 預設 | 說明 |
|---|---:|---|
| `pivotHeaderHeight` | `headerHeight` | 每一層 Pivot header 高度。 |
| `collapsibleSubtotals` | `true` | 顯示列／欄小計展開按鈕。 |
| `showRowFieldHeaders` | `true` | 顯示左側 row field 標頭。 |
| `showDetailOnDoubleClick` | `true` | 雙擊 aggregate cell 顯示原始明細。 |
| `customContextMenu` | `true` | 啟用 Pivot 專用右鍵選單。 |

PivotGrid 固定為唯讀，並停用一般 FabGrid 的編輯、欄位 Search Row、Excel-like filter、pagination、row drag 與 column drag。原始資料篩選必須由 PivotField filter 在 aggregate 前處理。

### PivotGrid properties

| Property | 說明 |
| --- | --- |
| `engine` | 目前連接的 PivotEngine，唯讀。 |
| `itemsSource` | PivotEngine alias；setter 會呼叫 `setPivotEngine()`。 |
| `collapsibleSubtotals` | 是否顯示列／欄小計展開收合按鈕。 |
| `showDetailOnDoubleClick` | 是否允許雙擊 aggregate cell 開啟原始明細。 |

### PivotGrid methods

- `setItemsSource(engine)`
- `setLocale(locale, messages?)`
- `setPivotEngine(engine)`
- `expandAll()`
- `collapseAll()`
- `toggleRowSubtotal(key)`
- `toggleColumnSubtotal(key)`
- `togglePivotFieldSort(field)`
- `getCellKeys(row, col)`
- `showDetail(row, col)`
- `hideDetail()`
- `isDetailOpen()`
- `dispose()`

FabGrid 的選取、CellRange、clipboard、CSV／Excel 匯出、`formatItem`、`hitTest()`、`refresh()`、`invalidate()` 與 `Control.getControl()` 仍可使用。

Pivot view 更新、排序或疊合造成列欄位置改變時，PivotGrid 會優先以 row key 與 data-column key 保留原本的邏輯選取；若原資料已不可見才會將選取範圍限制在目前 View。綁定為 PivotChart `selectionSource` 時，圖表會在重繪後重新同步該選取。

PivotGrid 預設 Excel 匯出會保留疊合欄位的完整子欄與資料，並在工作表中維持 hidden column 狀態；疊合列的明細也會完整匯出並維持 hidden row 狀態，使用者可在 Excel 內取消隱藏查看。只有明確傳入 `visibleOnly === true` 時，才只匯出目前畫面可見欄位；此參數不會移除疊合列的隱藏明細。

## 互動行為

- 點擊左側 row field header：依「預設 → 升冪 → 降冪 → 預設」循環；預設狀態保留 dimension 原始出現順序，且不顯示排序符號。
- PivotPanel Filters 欄位的內容選擇器會同步顯示在 PivotGrid 左上角；選擇全部或單一值後，在 aggregate 前篩選原始資料。
- 相鄰列若具有相同的父層 row field 值，PivotGrid 會將該父層顯示為一個跨越明細與小計列的疊合 cell，不重複列出相同文字。
- 點擊疊合父層 cell 旁的 `＋`／`−`：展開或收合後代；收合時只保留該群組的小計列，展開時恢復明細列。
- 雙擊 aggregate cell：使用同一份 FabGrid style 開啟原始明細 Grid。
- Header 或 aggregate cell 右鍵：排序、aggregate、移除欄位、明細與匯出；Row field 右鍵選單以單一「全部展開／全部疊合」狀態項目操作所有列與欄群組，不顯示單一「展開群組／疊合群組」項目。Header 右鍵選單另提供進入／離開 PivotGrid 全螢幕。點擊 popup 外部會立即關閉，點擊 popup 內部則維持開啟直到執行項目。
- `Escape`：關閉明細或已開啟的 Grid popup，不提交其他變更。

## 樣式與 Theme

PivotGrid 與 PivotPanel root 都具有 `.fg-root`，直接沿用 FabGrid 的：

- `--fg-border`
- `--fg-border-strong`
- `--fg-header-bg`
- `--fg-header-text`
- `--fg-cell-bg`
- `--fg-cell-text`
- `--fg-selected-bg`
- `--fg-selected-border`
- scrollbar、frozen divider、hover 與 active cell 規則

Pivot 不需要專用 Theme CSS，會跟隨頁面最後載入的 FabUI Theme CSS。完整規則請見 [Theme API](./theme-api.md)。

## Demo

- `demo/dev-pivot.html`：source-mode 開發版，引用 `src/fabui.js` 與 `src/fabui.css`。
- `demo/pivot.html`：build-mode 正式版，只引用 `dist/fabui.min.js` 與 `dist/fabui.css`。

## 範圍限制

- PivotEngine 僅處理本機 Array；server-side Pivot、OLAP／SSAS 不列入目前產品範圍。
- Grid DOM rendering 使用 FabGrid 雙向 virtualization；`refreshAsync()` 分批處理 aggregate，但最終 row／column 排序與 View 組裝仍在完成階段一次執行。
- calculated field 的 Function、Function filter、`getWeight` 不會序列化；保存 View 時應由應用程式以穩定 field key 重新提供 Function 定義。
