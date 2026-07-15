# FabGrid API 操作手冊

本手冊說明目前已發佈的 `fabui.FabGrid` 操作方式。FabGrid 是 pure JavaScript data grid；不依賴 Vue、React 或後端。

## 1. 載入與建立 Grid

### Browser global

```html
<link rel="stylesheet" href="./dist/fabui.css">
<div id="grid"></div>
<script src="./dist/fabui.min.js"></script>
<script>
  var grid = new fabui.FabGrid('#grid', {
    itemsSource: [
      { id: 1, name: '王小明', amount: 1280 },
      { id: 2, name: '陳小華', amount: 2560 }
    ],
    columns: [
      { binding: 'id', header: '編號', width: 80, align: 'center', dataType: 'number' },
      { binding: 'name', header: '姓名', width: 160 },
      { binding: 'amount', header: '金額', width: 120, align: 'right', dataType: 'number' }
    ]
  });
</script>
```

### ES module

```js
import fabui from './dist/fabui.esm.js';
import './dist/fabui.css';

const grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  columns
});
```

建構式第一個參數可傳 CSS selector 或 DOM element；找不到目標 element 時會拋出錯誤。

## 2. 建構選項

### 資料、版面與互動

| 選項 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `itemsSource` | `Array<object>` | `[]` | 本機資料來源。 |
| `columns` | `Array<Column>` | `[]` | 欄位定義。 |
| `rowHeight` | `number` | `32` | 每列固定高度。 |
| `headerHeight` | `number` | `32` | 欄位標題高度。 |
| `overscanRows` | `number` | `8` | 垂直虛擬化預先渲染列數。 |
| `fastScrollOverscanRows` | `number` | `64` | 快速捲動時額外渲染列數。 |
| `overscanColumns` | `number` | `3` | 水平虛擬化預先渲染欄數。 |
| `frozenColumns` | `number` | `0` | 左側凍結欄數。 |
| `frozenRightColumns` | `number` | `0` | 右側凍結欄數。 |
| `showRowHeaders` | `boolean \| 'numbers' \| 'none' \| 'cell'` | `true` | 顯示左側列號欄；`false`／`'none'` 隱藏，`'cell'` 只保留窄列頭 cell。 |
| `rowHeaderWidth` | `number` | `60` | 列號欄寬度。 |
| `showColumnChooser` | `boolean` | `true` | 顯示左上角欄位選擇器。 |
| `showFooter` | `boolean` | `false` | 顯示 footer aggregate 列。 |
| `footerHeight` | `number` | `32` | Footer 高度。 |
| `multiSelectRows` | `boolean` | `false` | 加入多選列 checkbox 欄。 |
| `selectionMode` | `string` | `'Cell'` | 目前使用單一 active cell 模式。 |
| `activeCellBorder` | `number` | `2` | Active cell 與 cell editor 邊框寬度，單位為 px；設為 `0` 可隱藏邊框。 |
| `allowSorting` | `boolean` | `true` | 是否允許點擊標題排序。 |
| `allowEditing` | `boolean` | `true` | 是否允許編輯。 |
| `editOnSelect` | `boolean` | `false` | 點選 cell 時直接開始編輯。 |
| `allowResizing` | `boolean` | `true` | 是否允許拖曳調整欄寬；雙擊 header 分隔線會自動調整為合適欄寬。 |
| `allowDragging` | `'None' \| 'Columns' \| 'Rows' \| 'All'` | `'None'` | `'Columns'` 重排欄位；`'Rows'` 啟用同一 Grid 或跨 Grid 資料列拖曳；`'All'` 同時啟用兩者。Row drag 僅支援本機資料。 |
| `showSearchRow` | `boolean` | `false` | 顯示每欄搜尋列；`datebox`、`combobox`、`color` 會沿用對應下拉 panel。搜尋輸入只套用 filter，不執行 cell validation。 |
| `updatedView` | `function(grid, eventArgs)` | `null` | View 完成更新時呼叫；等同註冊 `grid.updatedView.addHandler()`。 |
| `searchDelay` | `number` | `200` | 搜尋列輸入 debounce 時間（毫秒）。 |
| `headerDisplayMode` | `'header' \| 'binding'` | `'header'` | 標題顯示欄位標題或 binding。 |
| `headerToggleKey` | `string \| false` | `false` | 切換標題顯示模式的快捷鍵，例如 `'F4'`。 |
| `alternatingRows` | `boolean` | `false` | 使用交錯列背景。 |
| `locale` | `string \| object` | `null` | Locale 名稱或 locale object。 |
| `messages` | `object` | `null` | 覆寫 locale 文字。 |
| `observeItemsSource` | `boolean` | `false` | 以 Proxy 觀察直接修改的資料列；開啟會有額外成本。 |
| `childItemsPath` | `string \| function` | `null` | 指定子節點陣列的 binding path 或 callback；設定後啟用 TreeGrid。 |
| `treeColumn` | `number \| string \| Column` | `null` | 顯示階層箭頭與縮排的欄位；預設為第一個可見欄。 |
| `treeIndent` | `number` | `20` | 每一階 TreeGrid 縮排寬度，單位為 px。 |

### 分頁與遠端資料

| 選項 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `remote` | `boolean` | `false` | 啟用遠端資料模式。 |
| `url` | `string` | `null` | 遠端端點。 |
| `method` | `'get' \| 'post'` | `'get'` | 使用 `url` 時的 HTTP method。 |
| `loader` | `(params) => Promise<Response>` | `null` | 自訂載入函式；設定後優先於 `url`。 |
| `pagination` | `boolean` | `false` | 顯示分頁器。 |
| `pageNumber` | `number` | `1` | 目前頁碼。 |
| `pageSize` | `number` | `10` | 每頁筆數。 |
| `pageList` | `number[]` | `[10,20,30,40,50]` | 可選 page size。 |
| `pager` | `object` | `null` | 分頁器設定，可包含 `pageNumber`、`pageSize`、`pageList`、`showPageList`、`showPageInfo`、`showRefresh`。 |
| `showPageList` | `boolean` | `false` | 是否顯示 page size 下拉選單。 |
| `showPageInfo` | `boolean` | `true` | 是否顯示範圍與總筆數。 |
| `showRefresh` | `boolean` | `true` | 是否顯示重新整理按鈕。 |

### TreeGrid

TreeGrid 是 `fabui.FabGrid` 的階層資料模式，不是另一個 renderer 或 class。只要設定 `childItemsPath`，核心會把目前展開的節點扁平化為可視列，再交給既有垂直與水平 virtualization：

```js
var rows = [
  {
    id: 'D01',
    name: '研發部',
    children: [
      { id: 'T01', name: '前端工程組' },
      { id: 'T02', name: '後端工程組' }
    ]
  }
];

var grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  childItemsPath: 'children',
  treeColumn: 'name',
  columns: [
    { binding: 'name', header: '組織', width: 260 },
    { binding: 'id', header: '代碼', width: 100 }
  ]
});

grid.collapseGroupsToLevel(0);
```

節點箭頭與樹欄聚焦時的左右方向鍵都可收合／展開。排序只調整同一父節點下的兄弟順序，不會破壞階層；本機篩選會保留符合節點的祖先路徑，並暫時展開該路徑。TreeGrid 列號以完整展開後的階層順序為準，節點收合或篩選只隱藏列，不會重新編號。啟用 `pagination` 時以根節點數量分頁，每個根節點的可視子樹會留在同一頁。設定 `childItemsPath` 時 TreeGrid view 優先，不再套用 `rowGroups`。

設定 `allowDragging: 'Rows'` 後，可拖曳同一 TreeGrid 節點或從另一個啟用 row drag 的 Grid 移入。節點列上緣、中央、下緣分別代表 `before`、`inside`、`after`；核心會阻止把父節點移入自己的子孫節點。跨 Grid drop 採 move 語意，成功後資料會從來源 Grid 移除：

```js
var pool = new fabui.FabGrid('#pool', {
  itemsSource: availableRows,
  columns: columns,
  allowDragging: 'Rows'
});

var tree = new fabui.FabGrid('#tree', {
  itemsSource: organizationRows,
  columns: columns,
  childItemsPath: 'children',
  treeColumn: 'name',
  allowDragging: 'Rows'
});
```

若程式直接新增或替換 `children`，呼叫 `refreshTree()` 重新建立可視列。可用收合事件實作 lazy loading：

```js
grid.on('groupCollapsedChanged', function(e) {
  if (!e.tree || e.collapsed || e.item.children.length !== 1 || !e.item.children[0].loading) return;
  e.item.children = loadChildren(e.item);
  grid.refreshTree();
});
```

Lazy loading 節點需先放一筆 `{ loading: true }` placeholder，讓核心知道該節點可展開；實際資料載入後再替換 placeholder。

完整頁面請見 `demo/dev-treegrid.html`（source-mode）與 `demo/treegrid.html`（build-mode）；兩頁共用 `demo/js/treegrid-data.js` 的獨立階層範例資料與 `demo/js/treegrid.js` 互動入口。一般 Grid 的同 Grid 重排與跨 Grid 移動範例請見 `demo/dev-grid-grid.html`（source-mode）、`demo/grid-grid.html`（build-mode）與 `demo/grid-grid-vue2.html`（Vue 2）；Grid 拖入 TreeGrid 及節點上下階範例請見 `demo/dev-grid-treegrid.html`（source-mode）、`demo/grid-treegrid.html`（build-mode）與 `demo/grid-treegrid-vue2.html`（Vue 2）。

## 3. 欄位設定（`Column`）

```js
const columns = [
  { binding: 'id', header: '編號', width: 72, minWidth: 56, align: 'center', dataType: 'number' },
  {
    binding: 'amount',
    header: '金額',
    width: 120,
    align: 'right',
    dataType: 'number',
    thousandsSeparator: true,
    precision: 2,
    aggregate: 'sum'
  }
];
```

| 選項 | 型別 | 說明 |
| --- | --- | --- |
| `binding` | `string` | 對應資料欄位，可使用安全的巢狀路徑。 |
| `header` | `string` | 顯示於欄位標題的文字。 |
| `width` / `minWidth` | `number` | 欄寬與最小欄寬，預設為 `120` / `48`。 |
| `align` | `'left' \| 'center' \| 'right'` | 標題、內容與 editor 都沿用此對齊。 |
| `dataType` | `'string' \| 'number' \| 'date' \| 'boolean'` | 排序、解析與 editor 的資料型別。 |
| `visible` | `boolean` | 是否顯示；資料仍會保留。 |
| `readOnly` | `boolean` | 讓該欄不可編輯。 |
| `formatter` | `(value, item, column) => string` | cell 顯示格式化函式。 |
| `footer` / `footerFormatter` | `string \| function` | 自訂 footer 文字或格式化。 |
| `aggregate` | `'sum' \| 'avg' \| 'average' \| 'count' \| 'min' \| 'max' \| function` | Footer 與群組列的聚合計算。 |
| `editor` | `string \| object` | `textbox`、`numberbox`、`datebox`、`combobox` 或 `color`。 |
| `thousandsSeparator` | `boolean` | number 顯示千分位。 |
| `precision` | `number` | number 顯示與提交時的小數位。 |
| `mask` | `string` | 文字／日期遮罩；支援 `9`、`A`、`*`。 |
| `maskValueIncludesLiterals` | `boolean` | 資料值是否保留 `/` 等遮罩字元。 |
| `autoUnmask` | `boolean` | 自動移除遮罩字面值。 |
| `validate` | `(args) => ValidationResult \| Promise<ValidationResult>` | 同步或非同步驗證。 |

`validate` 回傳 `null`、`false` 或空字串表示通過；回傳字串或 `{ message }` 表示失敗。驗證失敗項目存放於 `grid.invalidItems`。

## 4. 實例方法

### 資料與欄位

| 方法 | 說明 |
| --- | --- |
| `setItemsSource(rows)` | 替換本機資料來源並重新建立 view。 |
| `setColumns(columns)` | 替換欄位集合。 |
| `setColumnVisible(column, visible)` | 顯示／隱藏指定欄；`column` 可為索引或欄位 object。成功回傳 `true`。 |
| `autoSizeColumn(column)` | 依 header、目前 view、群組 aggregate 與可見 footer 自動調整指定欄寬；成功回傳新寬度。 |
| `setRowGroups(groups)` | 設定 1 至 3 階群組設定。 |
| `setChildItemsPath(path)` | 設定子節點 path／callback 並重新建立 TreeGrid view；傳入 `null` 可停用。 |
| `getTreeRow(row)` | 取得可視樹列 descriptor，包含 `dataItem`、`level`、`parentItem`、`hasChildren`、`isCollapsed`、`rowNumber`。 |
| `toggleTreeNode(row, collapsed?)` | 切換或指定可視樹節點的收合狀態。 |
| `moveTreeItem(item, targetItem, position)` | 移動或插入 TreeGrid 節點；`position` 為 `'before'`、`'inside'`、`'after'`。成功回傳移動結果，無效或形成循環時回傳 `false`。 |
| `insertTreeItem(item, parentItem?, index?)` | 將新節點插入根層或指定父節點。 |
| `removeTreeItem(item)` | 從 TreeGrid 階層移除指定節點。 |
| `moveFlatRowItem(item, targetItem, position)` | 依 `'before'`／`'after'` 重排一般 Grid 的本機資料列。 |
| `removeRowItem(item)` | 從一般 Grid 或 TreeGrid 移除指定資料項目。 |
| `collapseGroupsToLevel(level)` | 將指定階層及以下的父節點收合；`0` 只保留根節點。 |
| `expandAllTreeNodes()` | 展開所有 TreeGrid 節點。 |
| `refreshTree()` | 子節點陣列直接變動後重新建立可視樹列。 |
| `getColumn(indexOrName)` | 依索引、`binding`、`header` 或 `name` 取得欄位。 |
| `getCellData(row, col)` | 讀取目前 view 的 cell 值。 |
| `setCellData(row, col, value)` | 寫入目前 view 的 cell 值；成功回傳 `true`。 |
| `refresh()` | 重新計算版面與渲染。 |
| `invalidate()` | 在下一個 animation frame 重新渲染。 |
| `dispose()` | 移除 DOM 與事件；元件不再可用。 |

### 顯示與互動

| 方法 | 說明 |
| --- | --- |
| `setFrozenColumns(count)` | 設定左側凍結欄數。 |
| `setFrozenRightColumns(count)` | 設定右側凍結欄數。 |
| `setRowHeaderWidth(width)` | Runtime 設定列號欄寬度並自動重新計算 layout 與 refresh；負數會限制為 `0`。 |
| `setShowRowHeaders(value)` | 切換列號欄。 |
| `setShowFooter(value)` | 切換 footer aggregate 列。 |
| `setShowSearchRow(value)` | 切換搜尋列。 |
| `isFullscreen()` | Grid root 目前是否處於 fullscreen。 |
| `isFullscreenAvailable()` | 瀏覽器是否支援 Grid fullscreen。 |
| `toggleFullscreen()` | 切換 Grid root fullscreen；不支援時回傳 `false`。 |
| `setEditMode(value)` | `true` 時點選 cell 即開始編輯。 |
| `setMultiSelectRows(value)` | 切換多選列 checkbox 欄。 |
| `setHeaderDisplayMode(mode)` | 設定 `'header'` 或 `'binding'`。 |
| `toggleHeaderDisplayMode()` | 切換標題顯示模式，並回傳新模式。 |
| `getHeaderDisplayMode()` | 取得目前標題顯示模式。 |
| `setLocale(locale, messages)` | 切換 locale 或覆寫顯示文字。 |

### 篩選與搜尋

| 方法 | 說明 |
| --- | --- |
| `setFilter(predicate)` | 本機模式設定資料列 predicate；遠端模式不可使用。 |
| `clearFilter()` | 清除 predicate、全域搜尋與欄位搜尋，並觸發 `filterChanged`。 |
| `setSearch(text)` | 設定全域搜尋字串。 |
| `setColumnSearch(column, value)` | 設定單欄搜尋值。 |
| `setColumnSearchOperator(column, operator)` | 設定欄位運算子，例如 `starts`、`contains`、`gte`、`eq`。 |
| `clearColumnSearch()` | 清除所有欄位搜尋。 |
| `clearSearchConditions(source)` | 清除全域與欄位搜尋，並觸發 `searchCleared`。 |

### 分頁、遠端載入與選取

| 方法 | 說明 |
| --- | --- |
| `load(params)` | 在遠端模式載入資料，回傳 `Promise<boolean>`。 |
| `reload()` | 依目前狀態重新載入遠端資料。 |
| `setPage(pageNumber)` | 切換頁碼。遠端模式回傳 `Promise<boolean>`，本機模式回傳 `boolean`。 |
| `setPageSize(pageSize)` | 改變 page size 並回到第一頁。 |
| `selectPage(pageNumber, pageSize)` | 同時設定頁碼與 page size。 |
| `getPager()` | 取得 `.fg-pager` 外層 DOM element。 |
| `select(row, col)` | 設定 active cell。 |
| `selectRow(row, col?)` | 選取一列。 |
| `selectAll()` | 將 active cell 移至第一個 cell 並觸發選取事件。 |
| `scrollIntoView(row, col, options?)` | 捲動指定 cell 至可見範圍。 |
| `validateRow(row)` | 驗證 `itemsSource` 的指定列，回傳 `Promise<boolean>`。 |

### 匯出

| 方法 | 說明 |
| --- | --- |
| `getCsv(visibleOnly?)` | 取得 CSV 字串；預設輸出可見欄，傳入 `false` 時輸出所有欄位。 |
| `exportCsv(filename?, visibleOnly?)` | 下載 CSV。 |
| `getExcelBlob(visibleOnly?)` | 取得 XLSX `Blob`；預設輸出所有欄位，傳入 `true` 時僅輸出可見欄。Excel 標題列會跟隨目前 `headerDisplayMode`。 |
| `exportExcel(filename?, visibleOnly?)` | 下載 XLSX，回傳 `Promise<boolean>`；預設為 `fabgrid.xlsx`，標題列會跟隨畫面當下顯示的 header 或 binding。 |

### 左上角功能表

在左上角列頭 cell 按滑鼠右鍵會開啟核心功能表，提供顯示／隱藏搜尋列、清除所有篩選、列號、匯出 Excel、匯出 CSV 與 Grid fullscreen。「清除篩選」會清除 predicate、全域搜尋與所有欄位搜尋；「列號」的下層功能表提供關閉、顯示列號及只顯示 cell，並以勾選標示目前模式。功能表文字跟隨目前 locale，搜尋列與 fullscreen 項目會依當下狀態切換文字。

## 5. 事件

使用 `grid.on(name, handler)` 註冊事件；handler 回傳 `false` 可取消支援取消的事件。

```js
grid.on('selectionChanged', function(e) {
  console.log(e.row, e.col);
});

grid.on('cellEditEnding', function(e) {
  if (e.value === 'blocked') return false;
});
```

| 事件 | 觸發時機 |
| --- | --- |
| `itemsSourceChanging` / `itemsSourceChanged` | 資料來源更新前／後。 |
| `loadingRows` / `loadedRows` | 本機資料載入流程前／後。 |
| `beforeLoad` / `loadSuccess` / `loadError` | 遠端載入前、成功或失敗。 |
| `pageChanging` / `pageChanged` | 分頁變更前／後。 |
| `selectionChanging` / `selectionChanged` | active cell 或列選取變更。 |
| `sortingColumn` / `sortedColumn` | 排序前／後。 |
| `cellEditEnding` / `cellEditEnded` | cell 編輯提交前／後。 |
| `resizingColumn` / `resizedColumn` | 拖曳欄寬期間／完成後。 |
| `autoSizingColumn` / `autoSizedColumn` | AutoFit 套用欄寬前／後；前者可取消或調整 `e.width`。 |
| `searchRowVisibilityChanged` | 呼叫 `setShowSearchRow()` 改變搜尋列顯示狀態後；`e.visible` 為目前狀態。 |
| `rowHeaderModeChanged` | 呼叫 `setShowRowHeaders()` 改變列號模式後；`e.mode` 為 `true`、`false` 或 `'cell'`。 |
| `draggingRow` | Row drag 開始或進入新落點時；可回傳 `false` 取消，`e.phase` 為 `'start'` 或 `'over'`。 |
| `draggedRow` | Row drop 完成後；包含 `e.sourceGrid`、`e.targetGrid`、`e.item`、`e.targetItem`、`e.position`。 |
| `groupCollapsedChanging` / `groupCollapsedChanged` | 群組或 TreeGrid 節點收合前／後；TreeGrid event args 會包含 `tree: true`、`row`、`item`、`level`、`collapsed`。 |
| `viewportChanged` | 可視 row、column 範圍或 render cell 數變動。 |
| `columnVisibilityChanged` | 欄位顯示狀態變更。 |
| `filterChanged` | Filter 條件套用完成後觸發；`setFilter()`、全域搜尋、欄位搜尋與所有清除 filter 操作都會觸發。 |
| `searchCleared` | 呼叫 `clearSearchConditions()`。 |
| `excelExporting` / `excelExported` / `excelExportFailed` | Excel 匯出流程。 |

`updatedView` 也可以直接在 constructor options 定義，初次 render 與後續 view 更新都會呼叫：

```js
const grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  columns: columns,
  updatedView: (g, e) => {
    console.log(e.totalRows);
  }
});
```

`filterChanged` 會在目前 filter 套用並 refresh 後觸發：

```js
grid.on('filterChanged', function(e) {
  console.log(e.source, e.active, e.cleared, e.viewRowCount);
});
```

事件參數包含 `source`、`active`、`cleared`、`remote`、`filterPredicate`、`searchText`、`columnSearchValues`、`columnSearchOperators`、`view` 與 `viewRowCount`。遠端模式會在重新載入資料前觸發；資料回傳完成仍使用 `loadSuccess`。

Wijmo-like aliases 也可使用，例如：

```js
grid.selectionChanged.addHandler(function(sender, e) {
  console.log(e.row, e.col);
});
```

## 6. 遠端資料協定

`remote: true` 時，FabGrid 可使用 `url` 或 `loader(params)`。`loader` 優先於 `url`。

```js
var grid = new fabui.FabGrid('#grid', {
  remote: true,
  url: '/api/orders',
  method: 'post',
  pagination: true,
  pager: {
    pageNumber: 1,
    pageSize: 50
  },
  columns: columns
});
```

送出的參數如下：

| 參數 | 說明 |
| --- | --- |
| `page` | 目前頁碼。 |
| `rows` | 每頁筆數。 |
| `sort` | 排序欄位，以逗號區隔；多欄排序時依序排列。 |
| `order` | `asc` 或 `desc`，與 `sort` 對應。 |
| `q` | 全域搜尋字串。 |
| `filterRules` | 欄位搜尋規則 JSON 字串，例如 `[{"field":"status","op":"eq","value":"草稿"}]`。 |

伺服器應回傳 EasyUI 格式：

```json
{
  "total": 1250,
  "rows": [
    { "id": 1, "name": "王小明" }
  ]
}
```

`method: 'get'` 會把參數放入 query string；`method: 'post'` 會使用 `application/x-www-form-urlencoded`。

## 7. 常用屬性

| 屬性 | 說明 |
| --- | --- |
| `itemsSource` | 原始資料集合。 |
| `collectionView` / `view` | 排序、篩選、群組與分頁後的目前 view。 |
| `columns` / `visibleColumns` | 全部欄位與目前可見欄位。 |
| `frozenColumns` / `frozenRightColumns` | 目前左右凍結欄數。 |
| `selectedItems` / `selectedRows` | 已選取資料與列索引。 |
| `activeCell` | 目前 active cell。 |
| `activeEditor` | 目前 editor；未編輯時為空。 |
| `invalidItems` | 驗證失敗的 cell 資訊。 |
| `scrollPosition` / `scrollSize` | 捲動位置與可捲動尺寸。 |
| `viewRange` | 目前可見 row、column 範圍。 |
| `isReadOnly` | 唯讀狀態。 |

## 8. 編輯器範例

```js
var columns = [
  {
    binding: 'amount',
    header: '金額',
    dataType: 'number',
    align: 'right',
    editor: 'numberbox',
    thousandsSeparator: true,
    precision: 2
  },
  {
    binding: 'status',
    header: '狀態',
    editor: {
      type: 'combobox',
      valueField: 'id',
      textField: 'descr',
      limitToList: true,
      data: [
        { id: 'active', descr: '啟用' },
        { id: 'paused', descr: '暫停' }
      ]
    }
  },
  {
    binding: 'color',
    header: '顏色',
    editor: {
      type: 'color',
      showAlpha: true,
      palette: ['#ff0000', '#00ff00', '#0000ff']
    }
  }
];
```

- `textbox`：一般文字輸入。
- `numberbox`：數字、千分位與 `precision`。
- `datebox`：日期面板與日期遮罩。
- `combobox`：下拉選項；可配合 `limitToList` 限制輸入值。
- `color`：色票與 HSV 顏色面板；支援 `#RGB`、`#RGBA`、`#RRGGBB`、`#RRGGBBAA` 與標準 CSS 顏色名稱。名稱不分大小寫，可直接預覽並保留原輸入文字，例如 `red` 提交後仍為 `red`；hex 短格式仍會正規化，例如 `#f00` 成為 `#ff0000`。`palette` 可自訂色票，`showAlpha: false` 可隱藏透明度控制。

雙擊 cell、按 `Enter` 或 `F2` 可開始編輯；`Enter` / `Tab` 提交並移至下一個可編輯欄，`Escape` 取消。
