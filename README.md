<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

# FabGrid

FabUI 提供 pure JavaScript FabGrid、獨立 EditBox、PivotPanel／PivotGrid／PivotChart、三合一 PivotWorkspace 與 SVG Chart。FabGrid 支援雙向 virtualization、凍結欄、TreeGrid、排序、搜尋、編輯、群組、分頁與 JSON / CSV / Excel 匯入匯出；EditBox 以單一 class 提供文字、數字、日期、清單與顏色編輯；PivotPanel 可互動定義 View，PivotGrid 顯示多階列／欄彙總，PivotChart 使用同一個 PivotEngine 將目前 View 顯示為直條圖、橫條圖、折線圖或圓餅圖。

## 文件與 Demo

- [Demo 索引](./demo/index.html)
- EditBox 本機 Demo：[source-mode 開發版](./demo/dev-editbox.html) 與 [獨立 build-mode 正式版](./demo/editbox.html)。
- [線上 FabGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/grid.html)
- [線上 TreeGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/treegrid.html)
- [線上 Grid / Grid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-grid.html)
- [線上 Grid / TreeGrid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-treegrid.html)
- [線上 Chart Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-chart.html)
- [線上 PivotGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot.html)
- [線上 PivotWorkspace Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot-workspace.html)
- PivotGrid 本機 Demo：[正式 build-mode](./demo/pivot.html) 與 [source-mode 開發版](./demo/dev-pivot.html)；source-mode 已提供右側 PivotChart panel，圖表類型選項會隨繁中、簡中、英文語系切換，正式版在下一次明確執行 build 時同步。
- PivotWorkspace 本機 Demo：[正式 build-mode](./demo/pivot-workspace.html) 與 [source-mode 開發版](./demo/dev-pivot-workspace.html)；整合 PivotPanel、PivotGrid、PivotChart，共用單一 PivotEngine，支援自適應三欄／三列與可拖曳 Splitter。兩個 Demo 的工具列皆可切換主題、語系、排列方式與 Pivot View 範例。
- Pivot 進階 source-mode Demo：[非同步彙總／PivotSlicer／計算欄位](./demo/dev-pivot-advanced.html)；展示 12,000 筆資料的分批彙總、取消、calculated field 與 WeightedAverage。
- Pivot source-mode Demo 使用單畫面 RWD 工作區，桌面顯示 PivotPanel、PivotGrid、PivotChart 三區，窄畫面改為上下排列；可分別隱藏／開啟定義與圖表 Panel。
- [FabGrid API 操作手冊](./docs/fabgrid-api.md)：完整的建構選項、欄位設定、方法、事件、遠端資料協定與匯出說明。
- [PivotGrid API 操作手冊](./docs/pivotgrid-api.md)
- [PivotChart API 操作手冊](./docs/pivotchart-api.md)
- [PivotWorkspace API 操作手冊](./docs/pivotworkspace-api.md)
- [Chart API 操作手冊](./docs/chart-api.md)
- [EditBox API 操作手冊](./docs/editbox-api.md)
- [Vue 2 Wrapper API](./docs/vue-api.md)
- [jQuery Wrapper API](./docs/jquery-api.md)
- [工作進度](./worklogs/)

## 快速使用

在 HTML 載入 CSS 與 browser global bundle，接著建立 Grid：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<div id="grid"></div>
<script src="./dist/fabui.js"></script>
<script>
  var rows = [
    { id: 1, name: '王小明', amount: 1280 },
    { id: 2, name: '陳小華', amount: 2560 }
  ];

  var columns = [
    { binding: 'id', header: '編號', width: 80, align: 'center', dataType: 'number' },
    { binding: 'name', header: '姓名', width: 160 },
    { binding: 'amount', header: '金額', width: 120, align: 'right', dataType: 'number' }
  ];

  var grid = new fabui.FabGrid('#grid', {
    itemsSource: rows,
    columns: columns,
    frozenColumns: 1,
    allowSorting: true,
    allowEditing: true,
    allowResizing: true
  });

  var sameGrid = fabui.Control.getControl('#grid');
</script>
```

ES module 使用者可由 `dist/fabui.esm.js` 匯入 `fabui`，再以 `new fabui.FabGrid(...)` 建立元件；完整範例與所有 API 請見 [API 操作手冊](./docs/fabgrid-api.md)。

Vue 2 Options API wrapper 位於 `packages/fabgrid-vue`，透過 `<fab-grid>` 使用 pure JavaScript core；Vue 不接管 cell rendering。

jQuery wrapper 位於 `packages/fabgrid-jquery`，透過 `$(element).fabgrid(options)` 建立或操作同一套 pure JavaScript core；jQuery 不參與 cell rendering。jQuery Demo 的初始化、公開方法與事件綁定都明確經過 wrapper：

```js
var $grid = $('#grid');

$grid.fabgrid({
  itemsSource: rows,
  columns: columns
});

$grid.fabgrid('setFrozenColumns', 2);
$grid.fabgrid('exportExcel', 'fabgrid-demo.xlsx');
$grid.on('selectionchanged.fabgrid', function(event, args) {
  console.log(args.row, args.col);
});
```

jQuery Demo 分成以下兩層：

- `demo/js/grid-jquery.js`：jQuery 專用 adapter，集中 `$.fn.fabgrid` 方法、option 與 jQuery event 操作。
- `demo/js/grid.js`：Pure JS 與 jQuery Demo 共用的資料展示、工具列、Popup、篩選及匯出流程。

開發版入口為 `demo/dev-jquery-grid.html`；引用 build 輸出的 browser global 版本為 `demo/grid-jquery.html`。

## 主要能力

- `fabui.pivot.PivotEngine` 使用 `rowFields`、`columnFields`、`valueFields` 與 `filterFields` 將本機 Array 建立為 Pivot view；支援 Sum、Count、Average、Min、Max、日期 Year／Quarter／Month／Day groupBy、小計、總計、總計位置與 viewDefinition。Average 只計入有效數值，Date filter 的 viewDefinition 經 JSON 保存／還原後仍依日期值比對；重新設定 fields 時會用穩定 key 重綁目前 View 區域。
- `fabui.pivot.PivotEngine` 保留同步 `refresh()`，並提供可取消的 `refreshAsync({ batchSize })`、進度事件與 `cancelRefresh()`；支援 calculated field、WeightedAverage 與 Grand Total／Row Total／Column Total 百分比、與前一項差異、差異百分比、累計等 ShowAs。
- `fabui.pivot.PivotPanel` 提供 Fields、Filters、Rows、Columns、Values 區域，支援勾選、滑鼠／觸控拖放排序、插入橫線提示、移除、filter field 多值草稿 dialog、Rows／Columns 右鍵預設／升冪／降冪排序、數值欄位右鍵 aggregate／ShowAs 設定與 JSON 字串 `viewDefinition` 儲存／還原；未按「套用」的 filter 草稿不會寫入 Engine，四個 View 區域皆不顯示上下移動按鈕。
- `fabui.pivot.PivotGrid` 繼承 FabGrid 的雙向 virtualization、CellRange、clipboard、匯出、Control lifecycle、Grid fullscreen 與 theme style；提供多層欄標頭、固定 row fields、左上角同步 filter field 內容選擇器、重複父層列值疊合、單擊列／欄 subtotal 展開收合、全部群組展開／疊合、Row field 右鍵以單一項目切換所有列與欄群組的全部展開／全部疊合、dimension 預設／升冪／降冪三態排序、Header 右鍵全螢幕、右鍵 aggregate 設定與雙擊原始明細。右鍵 popup 支援 `Escape` 與點擊外部關閉。預設排序不顯示符號並保留原始出現順序。父層收合後只保留該群組小計列；Excel 預設仍匯出疊合子欄與明細列，並分別維持 hidden column／hidden row 狀態。
- `fabui.pivot.PivotChart` 直接綁定 PivotEngine 或 PivotPanel，共用 filter、dimension 排序、Rows、Columns 與 Values 設定；預設排除重複的小計／總計，並以 `maxPoints`／`maxSeries` 限制 SVG 圖表規模。內部組合既有 `fabui.Chart`，支援 Column、Bar、Line、Pie、圖例與 Pie series 選擇；Pie 預設顯示百分比，點擊扇形會沿用 Chart 的旋轉與位移動畫。傳入共用同一個 PivotEngine 的 PivotGrid 作為 `selectionSource` 後，圖表會隨 Grid 疊合／展開立即重繪：展開時顯示明細彙總，疊合時以群組小計取代隱藏明細；圖形 point 與 Grid 彙總 cell 會依 Pivot row key 和 data-column binding 雙向同步選取。
- `fabui.pivot.PivotSlicer` 綁定同一個 PivotEngine 與 PivotField，提供搜尋、多選草稿、套用與清除；可與 PivotPanel、PivotGrid、PivotChart、PivotWorkspace 共用篩選狀態。
- `fabui.pivot.PivotWorkspace` 直接組合既有 PivotPanel、PivotGrid、PivotChart，公開共用 `engine` 與三個子元件 instance；寬容器使用三欄，窄容器自動切換三列，兩條 Splitter 支援滑鼠、觸控與鍵盤調整大小。`chartSize` 接受固定 px、百分比及 `fr`，預設 `'40%'`；Grid 標題列內建定義區／圖表區顯示切換、非同步彙總進度／取消／錯誤狀態與 Pane 全螢幕，Chart 標題列內建多語系圖形切換與 Pane 全螢幕。隱藏 Panel 或 Chart 時相鄰 Splitter 一併隱藏，Grid 自動擴展。
- 固定列高與欄寬的雙向 virtualization，適合大量資料。
- `childItemsPath` TreeGrid 模式、節點收合／展開、階層鍵盤導覽、同層排序、保留祖先路徑的篩選，以及收合／篩選後維持原始列號。樹欄所有資料 cell 都可按滑鼠右鍵開啟單一狀態項目，依目前狀態切換整棵樹的全部展開／全部疊合。
- `allowDragging: 'Rows'` 支援一般 Grid 列重排、跨 Grid 移動、跨 Grid 移入 TreeGrid，以及 TreeGrid `before`／`inside`／`after` 節點上下階；開發範例為 `demo/dev-grid-grid.html` 與 `demo/dev-grid-treegrid.html`，其他範例為 `demo/grid-grid.html`、`demo/grid-grid-vue2.html`、`demo/grid-treegrid.html` 與 `demo/grid-treegrid-vue2.html`。
- 欄位 Header Row 右鍵功能表，可切換搜尋列、清除所有篩選、從「列號」下層選擇關閉／顯示列號／只顯示 cell、匯出 Excel／CSV 與進入或離開 Grid fullscreen。
- Grid 右鍵選單、Filter、欄位選擇器與 date／combo／color editor popup，以及 PivotPanel 排序／彙總 popup，都支援按 `Escape` 或點擊 popup 外部關閉；點擊 popup 內部或 trigger 不會誤關閉，關閉也不會提交尚未確認的內容。
- 左右凍結欄、可由 `setRowHeaderWidth(width)` runtime 調整的列號欄、欄位顯示切換、footer aggregate 與 1 至 3 階群組；body 凍結分隔線只顯示於實際資料列。
- 本機資料或 `remote: true` 遠端分頁、排序與搜尋；`allowFiltering` 是 Search Row 與 Excel-like 欄位篩選的共用開關，關閉時會清除兩套欄位條件且只保留右下角 Quick Search；啟用後由 `showSearchRow` 選擇 Search Row 或 Excel-like 值篩選，兩套不混用，Excel-like popup 可按 `Escape` 關閉且不套用草稿。
- Filterable Header 文字維持垂直置中，漏斗 icon 疊在右上方；filter icon 使用獨立 hit area，點擊只開啟篩選選單，不觸發欄位排序，Header 右邊界仍保留較高層級的欄寬調整 hit area。
- `updatedView` 可直接在 constructor options 傳入 `(grid, eventArgs) => {}`，也保留 `grid.updatedView.addHandler()` 與 `grid.on('updatedView')`。
- `selectionMode` 支援單一 `Cell` 與可由滑鼠拖曳／Shift 延伸的 `CellRange`；CellRange 雙擊只在同一資料格的連續 pointer 操作成立，取消 pointer 不觸發雙擊，完成 pointer 選取後不會由 click 重複 render。`highlightActiveRow` 預設為 `true` 且可獨立關閉 active row 背景，另保留多選列、鍵盤導覽與預設 2px active cell 邊框。
- `alternatingRowStep` 預設為 `1`，可用正整數控制每幾列切換一次交替背景，設為 `false` 則關閉交替色。
- `formatItem.addHandler((g, e) => {})` 提供 Wijmo-compatible cell 格式化事件，使用 `fabui.CellType`、GridPanel `getCellData()` 與 `g.rows[e.row].dataItem` 處理 Header、Footer、資料 cell 與列頭。
- Column `cellTemplate` 支援 Wijmo-compatible `string | function | null`；函式簽名為 `(ctx, cell)`，可回傳 HTML 字串，或直接修改 cell 並回傳 `null`。Callback 的 `cell.style = ...` 會作為自訂視覺樣式疊加且不覆蓋 Grid 定位，指定 `null` 則保留原 Grid 樣式。
- `g.rows` 與 `selectedRows` 回傳 `fabui.FabGrid.Row`／`fabui.FabGrid.GroupRow` instance；`GroupRow` 繼承 `Row`，可用來判斷一般資料列與群組列。
- `fabui.Control.getControl(elementOrSelector)` 可用 host element 或 `'#' + grdId` 取得既有 FabGrid instance；找不到或 Grid 已 `dispose()` 時回傳 `null`。
- `grid.addEventListener(target, type, fn, capture?, passive?)` 提供 Wijmo-compatible managed DOM event，`dispose()` 時自動解除；欄位拖曳、欄寬調整、CellRange、捲軸與資料列拖曳使用的 document pointer listener 只在互動期間綁定。`grid.hitTest(e)` 以 `fabui.CellType`、panel、row／col 與 `isSearchRow` 辨識資料 cell、Header、Search Row、列頭及 Footer。
- `text`、`number`、`date`、`combo`、`color` editor，以及同步／非同步欄位驗證；舊 `textbox`、`numberbox`、`datebox`、`combobox` 保留為相容別名。`date` 在 mask 為 `9999/99` 或 `9999-99` 時使用年月 popup，且 `autoUnmask` 預設為 `true`，複製時移除遮罩；`color` 可輸入 hex 或標準 CSS 顏色名稱，名稱提交後保留原文字，並提供 60 色 palette、飽和度／明度、色相與透明度控制。獨立 EditBox 與 FabGrid 使用相同 editor 類型、別名、共用 definitions 與 icon descriptor 契約。
- 欄位搜尋列會為 `date`、`combo`、`color` 顯示對應下拉 panel；搜尋輸入僅建立 filter，不執行 cell validation。
- JSON 匯入／匯出與 CSV、XLSX 匯出；JSON 預設完整 round-trip `itemsSource`，Excel 支援凍結窗格、篩選、群組、footer、格式與隱藏欄，匯出標題跟隨當下 header／binding 顯示模式。
- `en`、`zh-TW`、`zh-CN` locale 檔案與多組內建主題。

## 套件與原始碼結構

`fabui` 是最上層 namespace，FabGrid core bundle 公開 `fabui.FabGrid`、`fabui.pivot`、`fabui.Chart` 與必要的 `fabui.Control`、`fabui.CellType`、`fabui.editorDefinitions`、`fabui.FabGridLocales`。獨立載入 `dist/editbox.min.js` 後會增加 `fabui.EditBox`，但 EditBox 不會併入 core bundle。Pivot 類別與列舉統一由 `fabui.pivot.PivotPanel`、`fabui.pivot.PivotGrid`、`fabui.pivot.PivotChart`、`fabui.pivot.PivotWorkspace`、`fabui.pivot.PivotSlicer`、`fabui.pivot.PivotEngine`、`fabui.pivot.PivotField`、`fabui.pivot.PivotAggregate`、`fabui.pivot.PivotShowAs`、`fabui.pivot.PivotShowTotals` 取得；頂層不重複公開。Row 類型只由 `fabui.FabGrid.Row` 與 `fabui.FabGrid.GroupRow` 公開。後續元件 roadmap 另有參考 EasyUI Material Teal 契約的 Window、Panel、Layout，詳見 [TODO](./TODO.md)。

可透過 `fabui.version` 取得發佈日期版本，格式為 `YYYY.M.D`，例如 `2026.7.11`。每次執行 build 時會依本機當天日期自動產生。

```text
src/fabui.js                        公開入口
src/core/control.js                 Host element 與 Control instance registry
src/grid/fabgrid.js                 FabGrid factory、公共 API、事件與模組協調
src/grid/fabgrid-view.js            Layout、雙向 virtualization 與 rendering
src/grid/fabgrid-filter-ui.js       Search Row、Excel-like filter 與 popup UI
src/grid/fabgrid-selection.js       選取、鍵盤、clipboard 與欄位互動
src/grid/fabgrid-editor-runtime.js  Cell editing、editor panel 與 validation
src/grid/fabgrid-data.js            Data view、remote、pagination 與 grouping
src/grid/fabgrid-tree.js            TreeGrid 可視列、狀態與互動
src/grid/fabgrid-drag.js            Row drag 與跨 Grid drop
src/grid/fabgrid-export.js          CSV 與 Excel 匯出
src/editbox/editbox.js             獨立 EditBox 公開入口與統一 API
src/editbox/editbox-definitions.js FabGrid／EditBox 共用 editor 定義
src/editbox/editbox.css            EditBox 獨立樣式入口
src/pivot/pivot-engine.js           Pivot 欄位、分組、彙總與 view definition
src/pivot/pivot-chart.js            Pivot view 到 SVG Chart 的 adapter 與 lifecycle
src/pivot/pivot-chart.css           沿用 FabGrid theme variables 的 PivotChart 樣式
src/pivot/pivot-workspace.js        PivotPanel／PivotGrid／PivotChart 組合與 Splitter lifecycle
src/pivot/pivot-workspace.css       PivotWorkspace 自適應三欄／三列與 Splitter 樣式
src/pivot/pivot-panel.js            Pivot View 欄位配置與儲存還原 UI
src/pivot/pivot-panel.css           沿用 FabGrid theme variables 的 PivotPanel 樣式
src/pivot/pivot-grid.js             PivotGrid lifecycle、多層標頭與互動
src/pivot/pivot-grid.css            沿用 FabGrid CSS variables 的 Pivot 樣式
src/editor/editor-definitions.js   舊 editor definitions import 相容入口
```

FabGrid core 發佈檔位於 `dist/`：`fabui.js`、`fabui.min.js`、`fabui.esm.js`、`fabui.esm.min.js`、`fabui.css` 與主題 CSS。EditBox 獨立輸出為 `editbox.js`、`editbox.min.js`、`editbox.esm.js`、`editbox.esm.min.js`、`editbox.css`、`editbox.min.css`。

## 本機開發

```bash
npm run serve
```

開啟 `http://127.0.0.1:4173/demo/grid.html` 查看 build-mode Demo，或開啟 `http://127.0.0.1:4173/demo/dev-grid.html` 查看 source-mode Demo。若需要重新產生發佈檔，請執行：

```bash
npm run build
```

## 專案方向

FabGrid 保持核心 pure JavaScript 與效能優先；現有 Vue 2 與 jQuery wrapper 僅負責 options、events、methods 與 lifecycle 對應，不接管 cell rendering。
