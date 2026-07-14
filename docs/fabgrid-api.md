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
| `showRowHeaders` | `boolean \| 'numbers' \| 'none'` | `true` | 顯示左側列號欄；可用 `'none'` 隱藏。 |
| `rowHeaderWidth` | `number` | `60` | 列號欄寬度。 |
| `showColumnChooser` | `boolean` | `true` | 顯示左上角欄位選擇器。 |
| `showFooter` | `boolean` | `false` | 顯示 footer aggregate 列。 |
| `footerHeight` | `number` | `32` | Footer 高度。 |
| `multiSelectRows` | `boolean` | `false` | 加入多選列 checkbox 欄。 |
| `selectionMode` | `string` | `'Cell'` | 目前使用單一 active cell 模式。 |
| `activeCellBorder` | `number` | `1` | Active cell 與 cell editor 邊框寬度，單位為 px；設為 `0` 可隱藏邊框。 |
| `allowSorting` | `boolean` | `true` | 是否允許點擊標題排序。 |
| `allowEditing` | `boolean` | `true` | 是否允許編輯。 |
| `editOnSelect` | `boolean` | `false` | 點選 cell 時直接開始編輯。 |
| `allowResizing` | `boolean` | `true` | 是否允許拖曳調整欄寬。 |
| `allowDragging` | `'None' \| 'Columns'` | `'None'` | 設為 `'Columns'` 可拖曳重排欄位。 |
| `showSearchRow` | `boolean` | `false` | 顯示每欄搜尋列；`datebox`、`combobox`、`color` 會沿用對應下拉 panel。搜尋輸入只套用 filter，不執行 cell validation。 |
| `searchDelay` | `number` | `200` | 搜尋列輸入 debounce 時間（毫秒）。 |
| `headerDisplayMode` | `'header' \| 'binding'` | `'header'` | 標題顯示欄位標題或 binding。 |
| `headerToggleKey` | `string \| false` | `false` | 切換標題顯示模式的快捷鍵，例如 `'F4'`。 |
| `alternatingRows` | `boolean` | `false` | 使用交錯列背景。 |
| `locale` | `string \| object` | `null` | Locale 名稱或 locale object。 |
| `messages` | `object` | `null` | 覆寫 locale 文字。 |
| `observeItemsSource` | `boolean` | `false` | 以 Proxy 觀察直接修改的資料列；開啟會有額外成本。 |

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
| `setRowGroups(groups)` | 設定 1 至 3 階群組設定。 |
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
| `setShowRowHeaders(value)` | 切換列號欄。 |
| `setShowFooter(value)` | 切換 footer aggregate 列。 |
| `setShowSearchRow(value)` | 切換搜尋列。 |
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
| `clearFilter()` | 清除 predicate、全域搜尋與欄位搜尋。 |
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
| `getExcelBlob(visibleOnly?)` | 取得 XLSX `Blob`；預設輸出所有欄位，傳入 `true` 時僅輸出可見欄。 |
| `exportExcel(filename?, visibleOnly?)` | 下載 XLSX，回傳 `Promise<boolean>`；預設為 `fabgrid.xlsx`。 |

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
| `viewportChanged` | 可視 row、column 範圍或 render cell 數變動。 |
| `columnVisibilityChanged` | 欄位顯示狀態變更。 |
| `searchCleared` | 呼叫 `clearSearchConditions()`。 |
| `excelExporting` / `excelExported` / `excelExportFailed` | Excel 匯出流程。 |

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
