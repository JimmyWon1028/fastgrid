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

建構式第一個參數可傳 CSS selector 或 DOM element；找不到目標 element 時會拋出錯誤。

### 由主題 CSS 檔名設定預設主題

頁面一次只載入一份獨立主題 CSS 時，可直接讓檔名決定新建 FabGrid 的預設主題：

```html
<link rel="stylesheet" href="<?= $g['js_path'] ?>fabui/fabui.<?= $theme ?>.min.css">
<div id="grid"></div>
<script src="<?= $g['js_path'] ?>fabui/fabui.min.js"></script>
<script>
  var grid = new fabui.FabGrid('#grid', options);
</script>
```

`<link>` 必須在建立 FabGrid 前存在。FabGrid 會從 `fabui.<theme>.min.css` 或 `fabui.<theme>.css` 的檔名辨識 19 組公開 theme，自動將 `fg-theme-<theme>` 加到 Grid root；URL 的 query string 或 hash 不影響辨識。一般整合檔 `fabui.min.css`、Lite 整合檔 `fabui.lite.min.css` 與不支援的 theme 名稱會維持既有預設主題。

### 公開 namespace 與靜態 API

| API | 說明 |
| --- | --- |
| `fabui.version` | 發佈日期版本，格式為 `YYYY.M.D`。 |
| `fabui.Button` | 支援 icon、plain、disabled、toggle、group 與多尺寸的按鈕；詳見 [Button API](./button-api.md)。 |
| `fabui.Calendar` | 與 DatePopup 共用 renderer 的獨立月曆；詳見 [Calendar API](./calendar-api.md)。 |
| `fabui.CheckBox` | 原生表單相容的核取方塊、label 位置、尺寸與狀態 API；詳見 [CheckBox API](./checkbox-api.md)。 |
| `fabui.CheckGroup` | 組合 CheckBox 的水平／垂直多選群組與原生表單欄位；詳見 [CheckGroup API](./checkgroup-api.md)。 |
| `fabui.SwitchButton` | 原生 checkbox 相容的滑動切換按鈕、ON／OFF／handle、reversed 與狀態 API；詳見 [SwitchButton API](./switchbutton-api.md)。 |
| `fabui.FileBox` | 組合 EditBox 與原生 file input 的檔案選擇控件；詳見 [FileBox API](./filebox-api.md)。 |
| `fabui.Tabs` | 動態頁籤、工具列、四方向排列與 overflow；詳見 [Tabs API](./tabs-api.md)。 |
| `fabui.Tree` | 階層清單、checkbox、拖放、編輯、篩選與 lazy loading；詳見 [Tree API](./tree-api.md)。 |
| `fabui.PropertyGrid` | 兩欄式屬性編輯、群組、共用 EditBox editor 與變更追蹤；詳見 [PropertyGrid API](./propertygrid-api.md)。 |
| `fabui.Tooltip` | 四方向定位、HTML、滑鼠追蹤與延遲提示；詳見 [Tooltip API](./tooltip-api.md)。 |
| `fabui.Menu` | Context／inline menu、巢狀 submenu、鍵盤與 runtime item API；詳見 [Menu API](./menu-api.md)。 |
| `fabui.MenuButton` | 組合 Button 與 Menu 的下拉選單按鈕；詳見 [MenuButton API](./menubutton-api.md)。 |
| `fabui.SplitButton` | 主區域執行動作、箭頭區顯示 Menu 的分割按鈕；詳見 [SplitButton API](./splitbutton-api.md)。 |
| `fabui.Messager` | Alert、Confirm、Prompt、Toast 與 Progress 訊息服務；詳見 [Messager API](./messager-api.md)。 |
| `fabui.EditBox` | FabUI core 內建的文字、數字、日期、清單與顏色編輯控件；詳見 [EditBox API](./editbox-api.md)。 |
| `fabui.Panel` | Header／Body／Footer 內容容器，支援 tools、狀態與遠端載入；詳見 [Panel API](./panel-api.md)。 |
| `fabui.Accordion` | 直接組合 Panel 的摺疊集合，支援單一／多重展開、動態 Panel 與三方向排列；詳見 [Accordion API](./accordion-api.md)。 |
| `fabui.Window` | 可拖曳、縮放、收合、最小化、最大化與 Modal 的視窗控件；詳見 [Window API](./window-api.md)。 |
| `fabui.Layout` | 以 Panel 組成的 north／south／east／west／center 五區版面；詳見 [Layout API](./layout-api.md)。 |
| `fabui.FabGrid.SelectionMode` | `Cell`、`CellRange` 選取模式常數。 |
| `fabui.FabGrid.Row` / `GroupRow` | 一般資料列與群組列類型。 |
| `fabui.CellType` | Cell、ColumnHeader、RowHeader、TopLeft、ColumnFooter、BottomLeft 列舉。 |
| `fabui.Control.getControl(elementOrSelector)` | 由 host element 取得既有 Control instance。 |
| `fabui.editorDefinitions` | FabGrid 與 `fabui.EditBox` 共用的 editor 定義。 |
| `fabui.FabGridLocales` | 已載入的 FabGrid locale registry。 |

## 2. 建構選項

### 資料、版面與互動

| 選項 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `itemsSource` | `Array<object>` | `[]` | 本機資料來源。 |
| `columns` | `Array<Column>` | `[]` | 欄位定義。 |
| `rowHeight` | `number` | `32` | 每列固定高度；非正數或非有限數字回復為預設值。 |
| `columnMinWidth` | `number` | `20` | Column 未指定 `minWidth` 時的全域最小欄寬，套用於初始欄寬、拖曳調寬與 AutoFit。 |
| `headerHeight` | `number` | `32` | 欄位標題高度。 |
| `overscanRows` | `number` | `8` | 垂直虛擬化預先渲染列數；正規化為非負整數。 |
| `fastScrollOverscanRows` | `number` | `64` | 快速捲動時額外渲染列數。 |
| `overscanColumns` | `number` | `3` | 水平虛擬化預先渲染欄數；正規化為非負整數。 |
| `frozenColumns` | `number` | `0` | 左側凍結欄數；正規化為非負整數並依可見欄數 clamp。 |
| `frozenRightColumns` | `number` | `0` | 右側凍結欄數；正規化為非負整數並避免與左側凍結欄重疊。 |
| `showRowHeaders` | `boolean \| 'numbers' \| 'none' \| 'cell'` | `true` | 顯示左側列號欄；`false`／`'none'` 隱藏，`'cell'` 只保留窄列頭 cell。 |
| `rowHeaderWidth` | `number` | `60` | 列號欄寬度。 |
| `rowHeaderHeader` | `string` | `''` | 左上角列頭標題文字。 |
| `showColumnChooser` | `boolean` | `true` | 顯示左上角欄位選擇器；popup 可按 `Escape` 或點擊 popup 外部關閉。 |
| `showFooter` | `boolean` | `false` | 顯示 footer aggregate 列。 |
| `footerHeight` | `number` | `32` | Footer 高度。 |
| `footerLabel` | `string` | `''` | Footer 左側列頭文字。 |
| `multiSelectRows` | `boolean` | `false` | 加入多選列 checkbox 欄。 |
| `selectionCheckboxWidth` | `number` | `44` | 多選列 checkbox 欄寬。 |
| `selectionMode` | `'Cell' \| 'CellRange'` | `'Cell'` | `Cell` 選取單一 active cell；`CellRange` 可用滑鼠拖曳、`Shift + Click` 或 `Shift + 方向鍵`選取連續矩形範圍。可由 `fabui.FabGrid.SelectionMode` 取得常數。 |
| `highlightActiveRow` | `boolean` | `true` | 顯示 active cell 所在列的背景；設為 `false` 時只保留 active cell／range，不影響多選列。 |
| `activeCellBorder` | `number` | `1` | Active cell 與 cell editor 邊框寬度，單位為 px；設為 `0` 可隱藏邊框。 |
| `allowSorting` | `boolean` | `true` | 是否允許點擊標題排序。 |
| `allowFiltering` | `boolean` | `true` | Search Row 與 Excel-like 欄位篩選的共用開關。設為 `false` 會隱藏兩套欄位篩選 UI、清除其條件並保留右下角 Quick Search。 |
| `allowEditing` | `boolean` | `true` | 是否允許編輯。 |
| `editOnSelect` | `boolean` | `false` | 點選 cell 時直接開始編輯。 |
| `allowResizing` | `boolean` | `true` | 是否允許拖曳調整欄寬；雙擊 header 分隔線會自動調整為合適欄寬。 |
| `allowDragging` | `'None' \| 'Columns' \| 'Rows' \| 'All'` | `'None'` | `'Columns'` 重排欄位；`'Rows'` 啟用同一 Grid 或跨 Grid 資料列拖曳；`'All'` 同時啟用兩者。Row drag 僅支援本機資料。 |
| `showSearchRow` | `boolean` | `false` | 顯示每欄搜尋列；初始化完成後預設聚焦第一個可見欄位的搜尋輸入框。顯示時 Header 漏斗使用原有欄位搜尋運算子，隱藏時改用 Excel-like 篩選。切換顯示狀態會先清除另一套欄位篩選，兩套不混用。 |
| `filterRules` | `Array<{field, op, value}> \| string` | `[]` | 初始化 Search Row 篩選；可傳陣列或相同內容的 JSON 字串。有效規則會自動啟用欄位篩選、顯示 Search Row、填入對應欄位 input 並顯示 operator 符號；本機第一次 view 與遠端第一次 POST Form Data／GET query 都直接套用。`remote: true` 時不驗證或轉換 `op`，會原樣送給後端；沒有對應 Grid column 的規則仍會送出。空值與一般陣列值會忽略；但 `remote: true` 的 `op: "in"` 陣列值會轉成逗號分隔字串。 |
| `excelFilterMaxValues` | `number` | `1000` | Excel-like「依值篩選」最多列出的唯一值數量；套用時仍保留未列出值原本的選取狀態。 |
| `updatedView` | `function(grid, eventArgs)` | `null` | View 完成更新時呼叫；等同註冊 `grid.updatedView.addHandler()`。 |
| `searchDelay` | `number` | `200` | 搜尋列輸入 debounce 時間（毫秒）。 |
| `searchRowHeight` | `number \| null` | `null` | 搜尋列高度；`null` 時沿用 `headerHeight`。 |
| `headerDisplayMode` | `'header' \| 'binding'` | `'header'` | 標題顯示欄位標題或 binding。 |
| `headerToggleKey` | `string \| false` | `false` | 切換標題顯示模式的快捷鍵，例如 `'F4'`。 |
| `alternatingRowStep` | `false \| number` | `1` | 交替列背景的分段列數；`false` 關閉，正整數 `1`、`2`、`3`…分別每 1、2、3…列切換一次背景。 |
| `autoClipboard` | `boolean` | `true` | 是否攔截 `Ctrl/Cmd + C` 並複製目前 cell 或 CellRange。 |
| `syncScrollRender` | `boolean` | `true` | 捲動時同步更新可視內容；設為 `false` 時改由 animation frame 排程。 |
| `itemFormatter` | `(cells, row, col, cell) => void` | `null` | Body cell 建立後的輕量格式化 callback；新程式優先使用 `formatItem` 或 `cellTemplate`。 |
| `exportBusyText` | `string \| null` | `null` | Excel 匯出期間顯示的忙碌文字。 |
| `locale` | `string \| object` | `null` | Locale 名稱或 locale object。 |
| `messages` | `object` | `null` | 覆寫 locale 文字。 |
| `observeItemsSource` | `boolean` | `false` | 以 Proxy 觀察直接修改的資料列；同一同步批次的多次 mutation 會合併為一次 view refresh。 |
| `rowGroups` | `Array<object>` | `[]` | 1 至 3 階列群組設定；TreeGrid 模式不套用。 |
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
| `loadMsg` | `string \| null` | `null` | 遠端載入期間顯示的文字。 |
| `pagination` | `boolean` | `false` | 顯示分頁器。 |
| `pageNumber` | `number` | `1` | 目前頁碼。 |
| `pageSize` | `number` | `10` | 每頁筆數。 |
| `pageList` | `number[]` | `[10,20,30,40,50]` | 可選 page size。 |
| `pager` | `object` | `null` | 分頁器設定，可包含 `pageNumber`、`pageSize`、`pageList`、`showPageList`、`showPageInfo`、`showRefresh`。 |
| `showPageList` | `boolean` | `false` | 是否顯示 page size 下拉選單。 |
| `showPageInfo` | `boolean` | `true` | 是否顯示範圍與總筆數。 |
| `showRefresh` | `boolean` | `true` | 是否顯示重新整理按鈕。 |
| `paginationHeight` | `number` | `35` | 分頁器高度。 |

### 列群組

`rowGroups` 依陣列順序建立最多三階群組。每階可用 `binding`／`bindings` 指定一個或多個欄位，也可用 `key(args)` 自訂群組鍵；`header(args)`／`formatter(args)` 可自訂群組列文字。

```js
var grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  columns: columns,
  rowGroups: [
    { binding: 'region' },
    {
      bindings: ['year', 'quarter'],
      formatter: function(args) {
        return args.key + '（' + args.count + ' 筆）';
      }
    }
  ]
});
```

具有 `aggregate` 的欄位會在群組列顯示彙總結果。群組收合狀態會在排序、篩選與 refresh 後保留；可使用 `toggleRowGroup()`、`toggleAllRowGroups()` 操作。

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

在樹欄的任一資料 cell 按滑鼠右鍵會開啟共用 Grid popup，並顯示單一「全部展開」或「全部疊合」狀態項目。只要目前仍有可視的展開節點就顯示「全部疊合」；全部疊合後才切換為「全部展開」。

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
| `width` / `minWidth` | `number` | 欄寬與最小欄寬；`width` 預設為 `120`，`minWidth` 未指定時使用 Grid `columnMinWidth`（預設 `20`）。 |
| `align` | `'left' \| 'center' \| 'right'` | 標題、內容與 editor 都沿用此對齊。 |
| `dataType` | `'string' \| 'number' \| 'time' \| 'date' \| 'boolean'` | 排序、解析與 editor 的資料型別。`time` 會自動使用 time editor。 |
| `visible` | `boolean` | 是否顯示；資料仍會保留。 |
| `readOnly` | `boolean` | 讓該欄不可編輯。 |
| `formatter` | `(value, item, column) => string` | cell 顯示格式化函式。 |
| `cellTemplate` | `string \| ((ctx, cell) => string \| null)` | 產生 body cell HTML；預設為 `null`。函式也可直接修改 `cell` 並回傳 `null`。 |
| `footer` / `footerFormatter` | `string \| function` | 自訂 footer 文字或格式化。 |
| `aggregate` | `'sum' \| 'avg' \| 'average' \| 'count' \| 'min' \| 'max' \| function` | Footer 與群組列的聚合計算。 |
| `editor` | `string \| object` | `text`、`number`、`time`、`date`、`combo` 或 `color`；舊 `*box` 名稱保留為相容別名。 |
| `thousandsSeparator` | `boolean` | number 顯示千分位。 |
| `precision` | `number` | number 顯示與提交時的小數位。 |
| `mask` | `string` | 文字／時間／日期遮罩；支援 `9`、`A`、`*`。Time 預設 `99:99`，也支援 `99:99:99`。 |
| `maskValueIncludesLiterals` | `boolean` | 資料值是否保留 `/` 等遮罩字元。 |
| `autoUnmask` | `boolean` | Time／Date editor 預設為 `true`；複製與資料輸出時移除遮罩字面值。明確設為 `false` 時保留遮罩。 |
| `validate` | `(args) => ValidationResult \| Promise<ValidationResult>` | 同步或非同步驗證。 |

`validate` 回傳 `null`、`false` 或空字串表示通過；回傳字串或 `{ message }` 表示失敗。驗證失敗項目存放於 `grid.invalidItems`。

### Cell template

`cellTemplate` 採 Wijmo-compatible 契約，只改變 body cell 顯示，不影響 editor、clipboard、CSV／Excel／JSON 匯出所使用的原始 binding value。Function template 的 context 包含 `col`、`row`、`item`、`value`、`text`；第二個參數是目前 cell element。

```js
grid.columns[idx].cellTemplate = (ctx, cell) => {
  cell.textContent = `${ctx.row.index + 1}. ${ctx.text}`;
  return null;
};
```

Function template 也可以回傳 HTML：

```js
grid.columns[idx].cellTemplate = (ctx) => (
  `<span class="${ctx.value > 0 ? 'change-up' : 'change-down'}">${ctx.text}</span>`
);
```

String template 使用 `${value}`、`${text}`、`${col}`、`${row}`、`${item}` scope：

```js
grid.columns[idx].cellTemplate =
  '<span class="${value > 0 ? \'change-up\' : \'change-down\'}">${text}</span>';
```

Runtime 指派會自動 invalidate Grid。Template 回傳內容會以 HTML 插入；不得直接插入未經處理的不可信資料。Function template 效能較好，也不需要 CSP 的 `unsafe-eval`；String template 需要允許動態函式編譯。

Function callback 執行前，FabGrid 會保存 cell 原本的 inline style。Callback 中直接指定 `cell.style = customStyle` 時，FabGrid 會把變更過的視覺樣式疊加回原樣式，並保護定位與尺寸屬性；指定 `cell.style = null` 時，callback 後會還原成原本的 Grid style。因此不需要自行保存或串接 `cell.style.cssText`。

```js
grid.columns[idx].cellTemplate = (ctx, cell) => {
  cell.style = ctx.value > 0 ? 'color: green; background: #efffed;' : null;
  return ctx.text;
};
```

## 4. 實例方法

### 資料與欄位

| 方法 | 說明 |
| --- | --- |
| `setItemsSource(rows)` | 替換本機資料來源並重新建立 view。 |
| `setColumns(columns)` | 替換欄位集合。 |
| `setColumnVisible(column, visible)` | 顯示／隱藏指定欄；`column` 可為索引或欄位 object。成功回傳 `true`。 |
| `setHeaderCellStyle(binding, style)` | 以欄位 `binding` 設定 Header cell style object；保留原樣式，同名 property 由傳入樣式覆蓋。傳入 `null` 清除，成功回傳 `true`。 |
| `autoSizeColumn(column)` | 依 header、目前 view、群組 aggregate 與可見 footer 自動調整指定欄寬；成功回傳新寬度。 |
| `setRowGroups(groups)` | 設定 1 至 3 階群組設定。 |
| `toggleRowGroup(rowIndex)` | 展開或收合指定群組列，並觸發群組收合事件。 |
| `toggleAllRowGroups()` | 依目前狀態展開或收合所有列群組。 |
| `isRowGroup(item)` | 判斷資料項目是否為合成群組列。 |
| `isRowGroupFooter(item)` | 判斷資料項目是否為合成 group footer。 |
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
| `addEventListener(target, type, fn, capture?, passive?)` | 以 Wijmo-compatible Control API 綁定 DOM event；Grid 會管理 listener，並在 `dispose()` 自動解除。 |
| `removeEventListener(target?, type?, fn?, capture?)` | 移除符合條件的 managed DOM listeners，回傳移除數量；不傳參數時全部移除。 |
| `hitTest(point, y?)` | 以 `MouseEvent`、HTMLElement、Point 或 page 座標取得 cell 的 `panel`、`cellType`、`row`、`col`、`viewCol`、`column`、`range` 與 `target`；`col` 對應 `grid.columns`，Search Row 另有 `isSearchRow: true`。 |
| `dispose()` | 移除 DOM 與事件；元件不再可用。 |

`setHeaderCellStyle()` 只比對實際 `binding`，不以 `header` 或 `name` 代替。Style 支援 camelCase、kebab-case 與 CSS custom property；FabGrid 會先套用原本的 Header 樣式，再疊加指定樣式，同名 property 以指定值為準。方法會複製傳入 object，後續修改原 object 不會改變已設定樣式。

```js
grid.setHeaderCellStyle('orderNo', {
  backgroundColor: '#fff4cc',
  color: '#663c00',
  'font-weight': 700
});

grid.setHeaderCellStyle('orderNo', null);
```

### 顯示與互動

| 方法 | 說明 |
| --- | --- |
| `setFrozenColumns(count)` | 設定左側凍結欄數。 |
| `setFrozenRightColumns(count)` | 設定右側凍結欄數。 |
| `setRowHeaderWidth(width)` | Runtime 設定列號欄寬度並自動重新計算 layout 與 refresh；負數會限制為 `0`。 |
| `setShowRowHeaders(value)` | 切換列號欄。 |
| `setShowFooter(value)` | 切換 footer aggregate 列。 |
| `setAllowFiltering(value)` | Runtime 切換 Search Row 與 Excel-like 欄位篩選；設為 `false` 時清除兩套欄位條件並保留 Quick Search。 |
| `setShowSearchRow(value)` | 切換搜尋列；切換前會清除另一套欄位篩選，Quick Search 保留。 |
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

初始化時可直接傳入與遠端協定相同的 `filterRules`。不必另外呼叫 `setColumnSearchOperator()` 或 `setColumnSearch()`：

```js
var grid = new fabui.FabGrid('#grid', {
  itemsSource: data,
  columns: [
    { binding: 'status', header: '狀態' },
    { binding: 'amount', header: '金額', dataType: 'number' }
  ],
  filterRules: [
    { field: 'status', op: 'eq', value: '草稿' },
    { field: 'amount', op: 'gte', value: 1000 }
  ]
});
```

上例會自動顯示 Search Row，在 `status` input 填入「草稿」並顯示 `=`，在 `amount` input 填入 `1000` 並顯示 `≥`。本機模式支援 `starts`、`contains`、`ends`、`not-starts`、`not-contains`、`not-ends`、`gte`、`gt`、`lte`、`lt`、`ne` 與 `eq`；省略 `op` 時使用 `starts`。`remote: true` 時不套用這份白名單，自訂 `op` 會保留大小寫與符號並原樣送出。

`remote: true` 的 SQL-like 字串運算符會另外映射到既有 Search Row filter icon，但 request 仍保留原始 `op`：`%..%` 對應包含、`..%` 對應開頭、`%..` 對應結尾；前置 `!` 分別對應不包含、非開頭與非結尾。

遠端模式使用 `method: 'POST'` 時，初始化規則會以 JSON 字串放入 `application/x-www-form-urlencoded` Form Data 的 `filterRules` 欄位；規則即使對應到未顯示的伺服器欄位，也會保留在 request 中。

| 方法 | 說明 |
| --- | --- |
| `setFilter(predicate)` | 本機模式設定資料列 predicate；遠端模式不可使用。 |
| `clearFilter()` | 清除 predicate、全域搜尋、Search Row 與 Excel-like 欄位篩選，並觸發 `filterChanged`。 |
| `setFilterRules(rules)` | 在 Grid 建立後一次取代所有 `filterRules`，同步 Search Row input 與運算符，並只觸發一次篩選更新；`remote: true` 時保留自訂 `op` 並重新載入。 |
| `getFilterRules()` | 取得目前實際生效、下一次會送給後端的 rules 陣列；包含 Search Row 最新 input 值，並回傳可安全修改的副本。 |
| `setSearch(text)` | 設定全域搜尋字串。 |
| `setColumnSearch(column, value)` | 設定單欄搜尋值；`allowFiltering: false` 時回傳 `false`。 |
| `setColumnSearchOperator(column, operator)` | 設定欄位運算子，例如 `starts`、`contains`、`gte`、`eq`；`allowFiltering: false` 時回傳 `false`。 |
| `clearColumnSearch()` | 清除所有欄位搜尋。 |
| `clearSearchConditions(source)` | 清除全域與欄位搜尋，並觸發 `searchCleared`。 |
| `setExcelFilter(column, filter)` | Search Rows 隱藏時設定 Excel-like 值篩選，格式為 `{ type: 'values', values: [...] }`。Search Rows 顯示或 `allowFiltering: false` 時回傳 `false`。 |
| `getExcelFilter(column)` | 取得指定欄位 Excel-like filter 的副本；未設定時回傳 `null`。 |
| `clearExcelFilter(column)` | 清除指定欄位 Excel-like filter。 |
| `clearExcelFilters(source?)` | 清除全部 Excel-like filters。 |

Excel-like 篩選 popup 開啟時可按 `Escape` 關閉；尚未按「套用」的選取變更不會寫入篩選條件。

所有 Grid popup（右鍵選單、Filter、欄位選擇器與 date／combo／color editor panel）都會在點擊外部時關閉；點擊 popup 內部或其 trigger 不會誤關閉。若同時存在多個 popup，點進其中一個會關閉其餘 popup。關閉 popup 不會自動套用、清除或提交尚未確認的內容。

Filterable Header 的漏斗 icon 使用獨立 hit area。點擊漏斗只開啟篩選選單，不會同時觸發排序或欄位拖曳；欄位右邊界仍可拖曳調寬或雙擊 AutoFit。

Search Row 遇到 `date`、`combo`、`color` editor 時會使用相同類型的下拉 panel。搜尋輸入只建立 filter，不會執行 cell editor 的欄位驗證。

Search Row 顯示時，Search input 聚焦後按 `↓`，active cell 會切到目前 selected row 與 Search input 所屬的同一 column，但不會向下移動 selected row，也不會啟動 cell editor；若目前 active cell／selected row 已被捲出可視範圍，Grid 會先捲動使其出現。Search input 隨即失焦，焦點轉到 Grid。焦點進入 Grid 後，再按方向鍵才開始移動 selected row／active cell；active cell 位於第一列時按 `↑`，焦點會回到同一 column 的 Search input。Search Row 未顯示時不套用這些焦點切換。Search input 聚焦時按 `↑` 仍沿用搜尋列內的向上選取行為並保留 input 焦點。日期、清單或顏色 popup 已開啟時，方向鍵優先交由 popup 處理。

### 分頁、遠端載入與選取

| 方法 | 說明 |
| --- | --- |
| `load(params)` | 在遠端模式載入資料，回傳 `Promise<boolean>`。 |
| `reload()` | 依目前狀態重新載入遠端資料。 |
| `setPage(pageNumber)` | 切換頁碼。遠端模式回傳 `Promise<boolean>`，本機模式回傳 `boolean`。 |
| `setPageSize(pageSize)` | 改變 page size 並回到第一頁。 |
| `selectPage(pageNumber, pageSize)` | 同時設定頁碼與 page size。 |
| `getPager()` | 取得 `.fg-pager` 外層 DOM element。 |
| `select(row, col?)` | 設定 active cell；省略 `col` 時使用第一個可見欄。若目標列未完整顯示，會自動捲動並盡量將該列對齊 Grid 可視區第一列。 |
| `selectRange(row, col, row2, col2)` | 在 `CellRange` 模式設定連續矩形範圍；前兩個座標為 anchor，後兩個座標為 active cell。 |
| `selectRow(row, col?)` | 選取一列。 |
| `unselectRow(row)` | `multiSelectRows: true` 時取消勾選指定列；未勾選的列不會被反向勾選。 |
| `selectAll()` | 將 active cell 移至第一個 cell 並觸發選取事件。 |
| `scrollIntoView(row, col, options?)` | 捲動指定 cell 至可見範圍。 |
| `validateRow(row)` | 驗證 `itemsSource` 的指定列，回傳 `Promise<boolean>`。 |
| `getSelectedText()` | 取得目前 cell 或 CellRange 的 TSV 文字；合成群組列會被排除。 |
| `copySelection()` | 將目前選取內容寫入系統剪貼簿，成功開始複製時回傳 `true`。 |
| `getClipString()` | Wijmo-compatible alias；回傳值等同 `getSelectedText()`。 |
| `setClipString(text)` | 將文字寫入目前 active cell；回傳值等同 `setCellData()`。 |

### 由 element 或 id 取得 Grid

`fabui.Control.getControl(elementOrSelector)` 可由 FabGrid 的 host element 或 CSS selector 取得既有 instance；沒有對應 Grid 時回傳 `null`。`grid.hostElement` 會回傳建立 Grid 時使用的 host element。

### DOM event 與 hitTest

`addEventListener()` 綁定的 listener 由 Control 管理，`dispose()` 時會自動解除。處理資料 cell 時應判斷 `hitTest()` 的 `cellType`，不要只檢查 `e.target.classList`，因為實際 target 可能是 Header、Search Row 或 cellTemplate 內的子元素。

Search Row 在 FabGrid 中屬於 `ColumnHeader` panel，並額外提供 `isSearchRow: true`。只允許一般資料 cell 的寫法如下：

```js
grid.addEventListener(grid.hostElement, 'dblclick', function(e) {
  var ht = grid.hitTest(e);
  if (ht.cellType !== fabui.CellType.Cell || ht.row < 0 || ht.col < 0) {
    return;
  }

  var row = grid.rows[ht.row];
  if (row instanceof fabui.FabGrid.GroupRow) {
    return;
  }

  var item = row.dataItem;
  var binding = grid.columns[ht.col].binding;
});
```

若只需要單獨辨識 Search Row，也可以使用：

```js
if (grid.hitTest(e).isSearchRow) {
  return;
}
```

### Cell 與 CellRange 選取

`selectionMode: 'Cell'` 維持單一 active cell；`highlightActiveRow` 只控制 active row 背景，預設為 `true`。設為 `false` 不會清除 active cell，也不會影響 `multiSelectRows` 已勾選的資料列。

`selectionMode: 'CellRange'` 支援以下操作：

- 在資料 cell 按下滑鼠並拖曳，選取連續矩形範圍。
- `Shift + Click` 從既有 anchor 延伸到點擊的 cell。
- `Shift + 方向鍵` 延伸範圍；一般方向鍵會移動 active cell 並回到單一 cell。
- `Ctrl/Cmd + C` 複製範圍為 tab／換行分隔文字。
- GroupRow 與 group footer 不會加入 cell range，也不會寫入範圍複製結果。

一般鍵盤導覽另支援：

- `Page Up`／`Page Down`：保持目前欄位並移動一個可視頁面。
- Windows／Linux `Ctrl + 方向鍵`：跳到同欄資料首尾或同列左右邊界。
- macOS `Fn + Option + ↑/↓`：跳到同欄資料首尾；DOM key 對應 `Option + PageUp/PageDown`。
- macOS `Fn + ←/→` 或 `Fn + Option + ←/→`：跳到同列左右邊界；DOM key 對應 `Home/End` 或 `Option + Home/End`。

```js
const grid = new fabui.FabGrid('#grid', {
  selectionMode: fabui.FabGrid.SelectionMode.CellRange,
  highlightActiveRow: false,
  itemsSource: rows,
  columns: columns
});

grid.selectRange(2, 1, 5, 3);
```

```js
const grdId = 'ordersGrid';
const grid = fabui.Control.getControl('#' + grdId);

if (grid) {
  grid.refresh();
}
```

FabGrid 建立完成後會自動登記，呼叫 `grid.dispose()` 時自動解除，因此不需要額外維護全域 Grid 變數。

### 匯出

| 方法 | 說明 |
| --- | --- |
| `getCsv(visibleOnly?)` | 取得 CSV 字串；預設輸出可見欄，傳入 `false` 時輸出所有欄位。 |
| `exportCsv(filename?, visibleOnly?)` | 下載 CSV。 |
| `getJson(options?)` | 取得 JSON 字串；預設輸出完整 `itemsSource`。傳入 `{ viewOnly: true }` 時輸出目前 view 並排除 group／group footer 合成列；`space` 與 `replacer` 會傳給 `JSON.stringify()`。 |
| `exportJson(filename?, options?)` | 下載 JSON，預設檔名為 `fabgrid.json`。 |
| `importJson(source)` | 匯入 JSON 並透過 `setItemsSource()` 更新 Grid，回傳 `Promise<boolean>`；支援 JSON 字串、Array、`{ rows }`、`{ itemsSource }`、Blob 與 File。 |
| `getExcelBlob(visibleOnly?)` | 取得 XLSX `Blob`；預設輸出所有欄位，傳入 `true` 時僅輸出可見欄。Excel 標題列會跟隨目前 `headerDisplayMode`。 |
| `exportExcel(filename?, visibleOnly?)` | 下載 XLSX，回傳 `Promise<boolean>`；預設為 `fabgrid.xlsx`，標題列會跟隨畫面當下顯示的 header 或 binding。 |

JSON 匯入／匯出範例：

```js
const json = grid.getJson({ space: 2 });

grid.exportJson('orders.json', { space: 2 });

await grid.importJson(json);
await grid.importJson(fileInput.files[0]);
```

JSON 使用標準 `JSON.stringify()`／`JSON.parse()`；日期會依 JSON 規格成為字串，循環參照與 `BigInt` 會由 `JSON.stringify()` 拋出錯誤。預設輸出完整 `itemsSource` 是為了保留 TreeGrid 階層與未顯示資料；只有明確指定 `viewOnly: true` 才輸出目前篩選／排序／分頁後的 view。

CSV 與 Excel 都以目前 Grid view 為資料來源。Excel 預設保留完整欄位集合；畫面隱藏的欄位仍包含資料，並在工作表標記為 hidden。只有明確傳入 `visibleOnly === true` 才排除隱藏欄。群組啟用時會保留群組列、aggregate 顯示格式與收合狀態；工作表同時包含凍結窗格、autoFilter 與目前 `headerDisplayMode` 對應的標題。

### Header Row 右鍵功能表

在一般欄位 Header Row 按滑鼠右鍵會開啟 Grid 功能表；左上角列頭、Search Row 與一般資料列不會觸發。功能表提供顯示／隱藏搜尋列、清除所有篩選、列號、匯出 Excel、匯出 CSV 與 Grid fullscreen。

「清除篩選」會清除 predicate、全域搜尋與所有欄位搜尋；「列號」的下層功能表提供關閉、顯示列號及只顯示 cell，並以勾選標示目前模式。功能表文字跟隨目前 locale，搜尋列與 fullscreen 項目會依當下狀態切換文字。TreeGrid 樹欄資料 cell 是唯一例外，右鍵時使用同一 popup 顯示全部展開／全部疊合。

## 5. 事件

使用 `grid.on(name, handler)` 註冊事件；handler 回傳 `false` 可取消支援取消的事件。

```js
grid.on('selectionChanged', function(e) {
  console.log(e.activeRow, e.activeCol, e.range);
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
| `selectionChanging` / `selectionChanged` | Active cell 或 cell range 變更；參數包含 `row`、`col`、`activeRow`、`activeCol`、`anchorRow`、`anchorCol` 與正規化後的 `range`。 |
| `sortingColumn` / `sortedColumn` | 排序前／後。 |
| `cellEditEnding` / `cellEditEnded` | cell 編輯提交前／後。 |
| `resizingColumn` / `resizedColumn` | 拖曳欄寬期間／完成後。 |
| `autoSizingColumn` / `autoSizedColumn` | AutoFit 套用欄寬前／後；前者可取消或調整 `e.width`。 |
| `searchRowVisibilityChanged` | 呼叫 `setShowSearchRow()` 改變搜尋列顯示狀態後；`e.visible` 為目前狀態，`e.clearedFilter` 表示切換時是否清除另一套欄位篩選。 |
| `rowHeaderModeChanged` | 呼叫 `setShowRowHeaders()` 改變列號模式後；`e.mode` 為 `true`、`false` 或 `'cell'`。 |
| `draggingRow` | Row drag 開始或進入新落點時；可回傳 `false` 取消，`e.phase` 為 `'start'` 或 `'over'`。 |
| `draggedRow` | Row drop 完成後；包含 `e.sourceGrid`、`e.targetGrid`、`e.item`、`e.targetItem`、`e.position`。 |
| `groupCollapsedChanging` / `groupCollapsedChanged` | 群組或 TreeGrid 節點收合前／後；TreeGrid event args 會包含 `tree: true`、`row`、`item`、`level`、`collapsed`。 |
| `viewportChanged` | 可視 row、column 範圍或 render cell 數變動。 |
| `columnVisibilityChanged` | 欄位顯示狀態變更。 |
| `filterChanged` | Filter 條件套用完成後觸發；`setFilter()`、全域搜尋、Search Row、Excel-like 篩選、模式切換與所有清除 filter 操作都會觸發。 |
| `formatItem` | Grid cell element 完成預設內容與格式後觸發；可使用 `formatItem.addHandler((g, e) => {})` 修改 Header、Footer、資料 cell 或列頭 DOM。 |
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

事件參數包含 `source`、`active`、`cleared`、`remote`、`filterPredicate`、`searchText`、`columnSearchValues`、`columnSearchOperators`、`excelFilters`、`view` 與 `viewRowCount`。遠端模式會在重新載入資料前觸發；資料回傳完成仍使用 `loadSuccess`。

Wijmo-like aliases 也可使用，例如：

```js
grid.selectionChanged.addHandler(function(sender, e) {
  console.log(e.row, e.col, e.range);
});
```

`formatItem` 使用 `fabui.CellType` 判斷 panel；數值與 Wijmo `CellType` 相容：`Cell=1`、`ColumnHeader=2`、`RowHeader=3`、`TopLeft=4`、`ColumnFooter=5`、`BottomLeft=6`。

```js
grid.formatItem.addHandler((g, e) => {
  if (e.panel.cellType === fabui.CellType.ColumnHeader) {
    e.cell.style.fontWeight = 'normal';
  } else if (e.panel.cellType === fabui.CellType.ColumnFooter) {
    const value = e.panel.getCellData(e.row, e.col, false);
    e.cell.textContent = value == null ? '' : String(value);
  } else if (e.panel.cellType === fabui.CellType.Cell) {
    const rowData = g.rows[e.row].dataItem;
    const field = g.columns[e.col].binding;
    if (rowData[field] < 0) {
      e.cell.classList.add('fg-negative-value');
    }
  }
});
```

事件參數包含 `panel`、`cell`、`range`、`row`、`col`、`data`、`item`、`column`、`value`、`updateContent`、`getRow()` 與 `getColumn()`。`g.rows[e.row].dataItem` 取得目前 view 的資料項目；`e.panel.getCellData(row, col, formatted)` 可讀取 panel 的原始值或顯示值。`formatItem` 會隨 virtualization 與 refresh 重複觸發，handler 應保持輕量並完整覆寫自己設定的 class、style 或內容。

`g.rows` 與 `g.selectedRows` 的成員是 Row instance。一般資料列與 TreeGrid 資料列使用 `fabui.FabGrid.Row`；群組 header 與 group footer 使用繼承自 Row 的 `fabui.FabGrid.GroupRow`。

```js
const r = grid.rows[rowIndex];

if (r instanceof fabui.FabGrid.Row && !(r instanceof fabui.FabGrid.GroupRow)) {
  const rowData = r.dataItem;
}
```

`Row` 提供 `grid`、`index`、`dataIndex`、`dataItem`、`visible`、`isReadOnly` 與 `collectionView`；`GroupRow` 另提供 `level`、`hasChildren`、`isCollapsed` 與 `isGroupFooter`。

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
| `filterRules` | 欄位搜尋規則 JSON 字串，例如 `[{"field":"status","op":"eq","value":"草稿"}]`。`op: "in"` 使用逗號分隔字串傳送 `value`，例如 `[{"field":"facno","op":"in","value":"ZU001,AV001"}]`。 |

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
| `selectedRanges` | 目前 cell selection range；`Cell` 模式為單一 cell，`CellRange` 為正規化後的矩形範圍。 |
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
    editor: {
      type: 'number',
      spinner: true,
      increment: 1,
      min: 0,
      max: 1000000
    },
    thousandsSeparator: true,
    precision: 2
  },
  {
    binding: 'startedAt',
    header: '開始時間',
    dataType: 'time',
    editor: {
      type: 'time',
      mask: '99:99:99',
      spinner: true
    }
  },
  {
    binding: 'status',
    header: '狀態',
    editor: {
      type: 'combo',
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

- `text`：一般文字輸入。
- `number`：數字預設靠右，支援千分位、`min`／`max`、前後綴與 `precision`。`editor.spinner` 預設為 `false`；設為 `true`／`'right'` 時在右側顯示上下箭頭，設為 `'left'` 時顯示於左側，並以 `increment` 控制每次增減值。
- `time`：預設使用 `99:99` 與 `autoUnmask: true`，也支援 `99:99:99`；分秒限制為 `00`–`59`，只有完整 `24:00`／`24:00:00` 可作為上限。可選 Spinner 依游標所在時、分或秒段落增減。
- `date`：日期面板與日期遮罩；`mask: '9999/99'` 或 `'9999-99'` 時改用年份／月份選擇 popup。
- `combo`：可編輯下拉選項；可配合 `editable: false` 停用文字輸入，或用 `limitToList` 限制為清單項目。
- `color`：色票與 HSV 顏色面板；支援 `#RGB`、`#RGBA`、`#RRGGBB`、`#RRGGBBAA` 與標準 CSS 顏色名稱。名稱不分大小寫，可直接預覽並保留原輸入文字，例如 `red` 提交後仍為 `red`；hex 短格式仍會正規化，例如 `#f00` 成為 `#ff0000`。`palette` 可自訂色票，`showAlpha: false` 可隱藏透明度控制。

雙擊 cell、按 `Enter` 或 `F2` 可開始編輯；`Enter` / `Tab` 提交並移至下一個可編輯欄，`Escape` 取消。

FabGrid 與 `fabui.EditBox` 共用 editor definitions、簡化名稱、相容別名、icon descriptor 與主要 options。Cell editor 的 `editor.icons`、Search Row 的 `search.icons`／`searchIcons` 與 EditBox 的 `icons` 統一使用 `{ iconCls, title, ariaLabel, text, width, align, keepFocus, onClick }`；舊 icon class 與 click callback 欄位名稱只保留相容。日期、清單與顏色 editor／Search Row 分別共用 EditBox 視覺基準的內部 DatePopup／ComboPopup／ColorPopup，不再維護 Grid 專屬 Calendar、option list、色票、HSV、Alpha renderer 或 CSS。各 editor 的完整 options 請見 [EditBox API](./editbox-api.md)；兩者都由 FabUI core bundle 提供。

Number cell editor 的 `spinner`、`increment`、`iconWidth`、`min`、`max` 與 `precision` 也直接沿用 `fabui.EditBox` 的共用 number definition。啟用 Spinner 時，`ArrowUp`／`ArrowDown` 會增減目前數值，不會提交並移到上一列或下一列；未啟用時維持原本的 Grid 垂直移動行為。Search Row 不顯示 Spinner，以保留搜尋列既有的方向鍵導覽。

Time cell editor 直接沿用同一個 `editorDefinitions.time`，包含遮罩、格式化、資料值、複製、24 小時驗證與 Spinner 段落調整；`timebox` 保留為相容別名。Search Row 沿用時間遮罩與數字輸入限制，但不顯示 Spinner。

Date editor 設定 `showLunar: true` 時，cell editor 與同欄 Search Row 的共用 DatePopup 都會在國曆日期下方顯示農曆日期；預設為 `false`：

```js
{
  binding: 'date',
  editor: {
    type: 'date',
    showLunar: true
  }
}
```

Grid 共用 DatePopup 會從 `.fg-root` 的 `fg-theme-*` class 繼承 Calendar theme；即使 popup 掛在 `document.body`，切換 Grid theme 時仍會同步更新，不需在 column editor 重複指定 theme。
