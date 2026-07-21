<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

# FabGrid

## FabGrid 介紹

FabGrid 是 FabUI 的高效能資料表元件，使用 pure JavaScript 開發，不依賴前端框架。名稱中的 **Fab** 取自 **Fabulous**，代表兼具效能、實用性與良好開發體驗。

FabGrid 透過水平與垂直 virtualization 處理大量資料，並提供凍結欄、TreeGrid、排序、搜尋、編輯、群組、分頁及資料匯出等常用功能。FabUI 另包含表單、導覽、視窗、圖表、Diagram 與 Pivot 分析元件。

FabGrid 的 active cell 與 cell editor 邊框預設為 `1px`，可透過 `activeCellBorder` 調整，設為 `0` 時隱藏邊框。

## 文件與 Demo

### 線上 Demo

- [線上 FabGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/grid.html)
- [線上 TreeGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/treegrid.html)
- [線上 Gantt Demo](https://jimmywon1028.github.io/fabgrid/demo/gantt.html)
- [線上 Grid / Grid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-grid.html)
- [線上 Grid / TreeGrid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-treegrid.html)
- [線上 Chart Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-chart.html)
- [線上 PivotGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot.html)
- [線上 PivotWorkspace Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot-workspace.html)
- [線上 Demo 索引](https://jimmywon1028.github.io/fabgrid/demo/index.html)

### 開發測試

- [開發版 Demo 索引](./demo/dev.html)
- 所有 source-mode 與 build-mode Demo 的預設主題統一為 `default`，仍可從各頁工具列切換其他 theme；公開元件統一公布 19 組 theme metadata。第 17 至 19 組為 `mono`、`mono-red`、`mono-green`，分別使用 Metro Gray、Metro Red、Metro Green 的版面色調，並共用 `src/theme/mono/images/` 的單色 SVG；正式 build 統一輸出 icon 到 `dist/theme/mono/`。三組 Mono theme 的 sprite icon 均拆成獨立 SVG，CSS 不引用 PNG／GIF。附加到 `body` 的 validation 與 editor popup 會跟隨目前主題。
- 頁面若在建立 FabGrid 前只載入一份 `fabui.<theme>.min.css`（例如 `fabui.mono-red.min.css`），FabGrid 會由檔名辨識公開 theme 並自動套用 `fg-theme-<theme>`，不必另外傳入 theme 或手動加入 class；query string／hash 不影響辨識。`fabui.min.css`、`fabui.lite.min.css` 與非公開 theme 名稱不會改變預設主題。
- 除 Demo 索引 `demo/dev.html` 與 `demo/index.html` 外，所有 Demo 的可操作欄位均優先由 FabUI 元件呈現；共用 `demo/js/demo-controls.js` 只補強尚未由頁面主元件接管的原生 host，開發版由 `src/` 注入 FabUI，正式版由 `dist/` 注入 FabUI，並保留既有表單與事件行為。Demo 樣式只處理版面，不覆蓋 FabUI 元件本身的視覺規則。`demo/dev.html` 以純文字 `<a>` 連結並列開發版與正式版，只有第一欄 Demo 項目可上下拖曳調整當次顯示順序；開發版與正式版連結不可拖曳，滑鼠移入時維持一般箭頭指標。`demo/index.html` 只列正式版，排列順序跟隨 `demo/dev.html` 中具有正式版連結的項目。兩個索引都不載入 FabUI CSS／JavaScript。
- 核心多語系統一提供 `en`、`zh-TW`、`zh-CN`，並相容 `zh-Hant`／`zh_Hant_TW` 與 `zh-Hans`／`zh_CN` 語系別名。
- `fabui.Button` Demo：[source-mode 開發版](./demo/dev-button.html) 與 [build-mode 正式版](./demo/button.html)。
- `fabui.Calendar` Demo：[source-mode 開發版](./demo/dev-calendar.html) 與 [build-mode 正式版](./demo/calendar.html)。
- `fabui.CheckBox` Demo：[source-mode 開發版](./demo/dev-checkbox.html) 與 [build-mode 正式版](./demo/checkbox.html)。
- `fabui.SwitchButton` Demo：[source-mode 開發版](./demo/dev-switchbutton.html) 與 [build-mode 正式版](./demo/switchbutton.html)。
- `fabui.CheckGroup` Demo：[source-mode 開發版](./demo/dev-checkgroup.html) 與 [build-mode 正式版](./demo/checkgroup.html)。
- `fabui.RadioButton` Demo：[source-mode 開發版](./demo/dev-radiobutton.html) 與 [build-mode 正式版](./demo/radiobutton.html)。
- `fabui.RadioGroup` Demo：[source-mode 開發版](./demo/dev-radiogroup.html) 與 [build-mode 正式版](./demo/radiogroup.html)。
- `fabui.FileBox` Demo：[source-mode 開發版](./demo/dev-filebox.html) 與 [build-mode 正式版](./demo/filebox.html)。
- `fabui.Form` Demo：[source-mode 開發版](./demo/dev-form.html) 與 [build-mode 正式版](./demo/form.html)。
- `fabui.Tabs` Demo：[source-mode 開發版](./demo/dev-tabs.html) 與 [build-mode 正式版](./demo/tabs.html)。
- `fabui.Tree` Demo：[source-mode 開發版](./demo/dev-tree.html) 與 [build-mode 正式版](./demo/tree.html)。
- `fabui.PropertyGrid` Demo：[source-mode 開發版](./demo/dev-propertygrid.html) 與 [build-mode 正式版](./demo/propertygrid.html)。
- `fabui.Diagram` Demo：[source-mode 開發版](./demo/dev-diagram.html) 與 [build-mode 正式版](./demo/diagram.html)。
- `fabui.Tooltip` Demo：[source-mode 開發版](./demo/dev-tooltip.html) 與 [build-mode 正式版](./demo/tooltip.html)。
- `fabui.Menu` Demo：[source-mode 開發版](./demo/dev-menu.html) 與 [build-mode 正式版](./demo/menu.html)。
- `fabui.MenuButton` Demo：[source-mode 開發版](./demo/dev-menubutton.html) 與 [build-mode 正式版](./demo/menubutton.html)。
- `fabui.SplitButton` Demo：[source-mode 開發版](./demo/dev-splitbutton.html) 與 [build-mode 正式版](./demo/splitbutton.html)。
- `fabui.Messager` Demo：[source-mode 開發版](./demo/dev-messager.html) 與 [build-mode 正式版](./demo/messager.html)。
- `fabui.EditBox` 本機 Demo：[source-mode 開發版](./demo/dev-editbox.html) 與 [build-mode 正式版](./demo/editbox.html)。
- `fabui.Panel` Demo：[source-mode 開發版](./demo/dev-panel.html) 與 [build-mode 正式版](./demo/panel.html)。
- `fabui.Accordion` Demo：[source-mode 開發版](./demo/dev-accordion.html) 與 [build-mode 正式版](./demo/accordion.html)。
- `fabui.Gantt` Demo：[source-mode 開發版](./demo/dev-gantt.html) 與 [獨立 build-mode 正式版](./demo/gantt.html)；必須先載入 `fabui.*`，再載入 `fabui.gantt.*`。
- `fabui.Scheduler` Demo：[source-mode 開發版](./demo/dev-scheduler.html) 與 [獨立 build-mode 正式版](./demo/scheduler.html)；必須先載入 `fabui.*`，再載入 `fabui.scheduler.*`。
- `fabui.Window` Demo：[source-mode 開發版](./demo/dev-window.html) 與 [build-mode 正式版](./demo/window.html)。
- `fabui.Layout` Demo：[source-mode 開發版](./demo/dev-layout.html) 與 [build-mode 正式版](./demo/layout.html)。
- PivotGrid 本機 Demo：[正式 build-mode](./demo/pivot.html) 與 [source-mode 開發版](./demo/dev-pivot.html)；source-mode 已提供右側 PivotChart panel，圖表類型選項會隨繁中、簡中、英文語系切換，正式版在下一次明確執行 build 時同步。
- PivotWorkspace 本機 Demo：[正式 build-mode](./demo/pivot-workspace.html) 與 [source-mode 開發版](./demo/dev-pivot-workspace.html)；整合 PivotPanel、PivotGrid、PivotChart，共用單一 PivotEngine，支援自適應三欄／三列與可拖曳 Splitter。兩個 Demo 的工具列皆可切換主題、語系、排列方式與 Pivot View 範例。
- Pivot 進階 source-mode Demo：[非同步彙總／PivotSlicer／計算欄位](./demo/dev-pivot-advanced.html)；展示 12,000 筆資料的分批彙總、取消、calculated field 與 WeightedAverage。
- Pivot source-mode Demo 使用單畫面 RWD 工作區，桌面顯示 PivotPanel、PivotGrid、PivotChart 三區，窄畫面改為上下排列；可分別隱藏／開啟定義與圖表 Panel。
- [工作進度](./worklogs/)

### API 操作手冊

- [FabGrid API 操作手冊](./docs/fabgrid-api.md)：完整的建構選項、欄位設定、方法、事件、遠端資料協定與匯出說明。
- [Pivot API 操作手冊](./docs/pivotgrid-api.md)：包含 PivotEngine、PivotField、PivotPanel、PivotSlicer 與 PivotGrid。
- [PivotChart API 操作手冊](./docs/pivotchart-api.md)
- [PivotWorkspace API 操作手冊](./docs/pivotworkspace-api.md)
- [Chart API 操作手冊](./docs/chart-api.md)
- [`fabui.Button` API 操作手冊](./docs/button-api.md)
- [`fabui.Calendar` API 操作手冊](./docs/calendar-api.md)
- [`fabui.CheckBox` API 操作手冊](./docs/checkbox-api.md)
- [`fabui.SwitchButton` API 操作手冊](./docs/switchbutton-api.md)
- [`fabui.CheckGroup` API 操作手冊](./docs/checkgroup-api.md)
- [`fabui.RadioButton` API 操作手冊](./docs/radiobutton-api.md)
- [`fabui.RadioGroup` API 操作手冊](./docs/radiogroup-api.md)
- [`fabui.FileBox` API 操作手冊](./docs/filebox-api.md)
- [`fabui.Form` API 操作手冊](./docs/form-api.md)
- [`fabui.Tabs` API 操作手冊](./docs/tabs-api.md)
- [`fabui.Tree` API 操作手冊](./docs/tree-api.md)
- [`fabui.PropertyGrid` API 操作手冊](./docs/propertygrid-api.md)
- [`fabui.Diagram` API 操作手冊](./docs/diagram-api.md)
- [`fabui.Tooltip` API 操作手冊](./docs/tooltip-api.md)
- [`fabui.Menu` API 操作手冊](./docs/menu-api.md)
- [`fabui.MenuButton` API 操作手冊](./docs/menubutton-api.md)
- [`fabui.SplitButton` API 操作手冊](./docs/splitbutton-api.md)
- [`fabui.Messager` API 操作手冊](./docs/messager-api.md)
- [`fabui.EditBox` API 操作手冊](./docs/editbox-api.md)
- [`fabui.Panel` API 操作手冊](./docs/panel-api.md)
- [`fabui.Accordion` API 操作手冊](./docs/accordion-api.md)
- [`fabui.Gantt` API 操作手冊](./docs/gantt-api.md)
- [`fabui.Scheduler` API 操作手冊](./docs/scheduler-api.md)
- [`fabui.Window` API 操作手冊](./docs/window-api.md)
- [`fabui.Layout` API 操作手冊](./docs/layout-api.md)
- [Vue 2 Wrapper API](./docs/vue-api.md)
- [jQuery Wrapper API](./docs/jquery-api.md)

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

Gantt 是獨立附加套件，不包含在 FabUI core。Browser global 必須先載入 `fabui.*`，再載入 `fabui.gantt.*`：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.gantt.css">
<div id="gantt"></div>
<script src="./dist/fabui.min.js"></script>
<script src="./dist/fabui.gantt.min.js"></script>
<script>
  var gantt = new fabui.Gantt('#gantt', {
    dataSource: tasks,
    dependencies: dependencies,
    view: 'week'
  });
</script>
```

Scheduler 是獨立附加套件，不包含在 FabUI core。Browser global 必須先載入 `fabui.*`，再載入 `fabui.scheduler.*`：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.scheduler.css">
<div id="scheduler"></div>
<script src="./dist/fabui.min.js"></script>
<script src="./dist/fabui.scheduler.min.js"></script>
<script>
  var scheduler = new fabui.Scheduler('#scheduler', {
    currentView: 'workWeek',
    dataSource: []
  });
</script>
```

Vue 2 與 FabGrid jQuery wrapper 目前暫緩開發，既有原始碼與說明保留作為未來參考；預設 `npm run build` 編譯 FabUI core、theme 與獨立 Gantt，不會產生 wrapper bundle。

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

FabGrid cell editor、Search Row 與 `fabui.EditBox` 的自訂 icon 都統一使用 `icons: [{ iconCls, title, ariaLabel, text, width, align, keepFocus, onClick }]`；完整範例與相容欄位請見 [EditBox API](./docs/editbox-api.md)。

Number EditBox 與 FabGrid number cell editor 都可用 `spinner: true`／`'right'` 在右側顯示上下增減箭頭，或用 `spinner: 'left'` 改放左側；`spinner` 預設為 `false`。Spinner 預設使用與其他 EditBox trigger 相同的 28px 寬度、底色與 icon 視覺，`increment` 預設為 `1`，並沿用 `min`、`max`、`precision` 與既有 change／cell edit 契約。

FabGrid 與 `fabui.EditBox` 共用 `time` editor definition；`editor: 'time'`／相容別名 `timebox` 預設使用 `99:99`、`autoUnmask: true`，也支援 `99:99:99` 與依游標所在時／分／秒調整的可選 Spinner。時間採 24 小時規則，只有 `24:00`／`24:00:00` 可作為上限。

Time EditBox 支援預設 `mask: '99:99'` 與 `99:99:99`，`autoUnmask` 預設為 `true`；時間範圍採 `00:00` 至 `24:00`（含秒時至 `24:00:00`），只有完整 24 時上限有效。可選的 Spinner 會依游標所在的時、分、秒段落增減。

## 主要能力

### FabGrid

| 類別 | 能力 |
| --- | --- |
| 效能 | 固定列高與欄寬的雙向 virtualization，只渲染可視範圍，適合大量資料。 |
| 資料來源 | 支援本機 Array，以及 `remote: true` 的遠端分頁、排序、搜尋與欄位篩選。 |
| 表格版面 | 支援左右凍結欄、列號欄、欄寬調整、欄位顯示切換、Footer aggregate、交替列背景與 Grid 全螢幕。 |
| Column 寬度 | `width` 預設為 `120px`；FabGrid `columnMinWidth` 定義 Column 未指定 `minWidth` 時的全域下限，預設 `20px`，並同步套用於拖曳調寬與 AutoFit。個別 Column `minWidth` 仍可覆寫。 |
| 排序與篩選 | 提供欄位排序、Quick Search、Search Row 與 Excel-like 值篩選；`allowFiltering` 可統一開關欄位篩選。初始化 `filterRules` 會在第一次本機 view／遠端 request 前套用；Grid 建立後可用 `setFilterRules(rules)` 一次取代規則並同步 Search Row input，並用 `getFilterRules()` 取得包含最新 input 值的實際規則副本。兩種設定方式都會自動啟用並顯示 Search Row、填入搜尋 input 與 operator 符號；`remote: true` 不驗證或轉換自訂 `op`，遠端 POST 會將原規則 JSON 字串放入 Form Data 的 `filterRules` 欄位，未對應顯示 column 的伺服器規則也會保留。啟用 Search Row 初始化後會聚焦第一個搜尋輸入框。Search Row 顯示時，搜尋 input 按向下鍵會先把焦點轉到目前列同一 column 的 active cell，不移動 selected row；若目前 active cell／selected row 已在畫面外，會先捲動使其出現。再次按方向鍵才由 Grid 開始移動。active cell 位於第一列時按向上鍵，焦點會回到同一 column 的搜尋 input。 |
| 群組與 TreeGrid | 支援 1 至 3 階群組、aggregate、群組收合，以及 `childItemsPath` TreeGrid、節點展開／收合、同層排序與階層鍵盤導覽。 |
| 資料列拖曳 | 支援 Grid 內重排、跨 Grid 移動，以及 TreeGrid 節點的 `before`、`inside`、`after` 階層調整；欄位、資料列與 PivotPanel 欄位拖曳的插入指示線統一使用 55% 半透明，資料列指示線的右邊界限制在實際欄位區域內。 |
| 選取與剪貼簿 | 支援 `Cell`、連續矩形 `CellRange`、滑鼠拖曳、Shift 延伸、鍵盤導覽與 TSV 複製。`select(row)` 預設選取第一個可見欄，`select(row, col)` 指定可見欄；兩者都會在目標列未完整顯示時自動捲動，並盡量將該列對齊 Grid 可視區第一列。多選列可用 `selectRow(row)` 勾選，並用 `unselectRow(row)` 取消勾選。 |
| 編輯與驗證 | 內建 `text`、`number`、`time`、`date`、`combo`、`color` editor，支援遮罩、同步／非同步驗證與自訂 editor。 |
| 顯示自訂 | 提供 formatter、`formatItem`、`cellTemplate`、依 binding 設定 Header cell style、Row／GroupRow、`hitTest()` 與完整事件 API。 |
| 匯入與匯出 | 支援 JSON 匯入／匯出、CSV 與 XLSX 匯出；Excel 可保留格式、凍結窗格、篩選、群組、Footer 與隱藏欄位。 |
| 元件生命週期 | `fabui.Control.getControl()` 可取得既有 instance；managed DOM listener 會在互動結束或 `dispose()` 時解除。 |
| Popup 行為 | 右鍵選單、Filter、欄位選擇器與 editor popup 都支援 `Escape` 及點擊外部關閉，不會提交未確認內容。 |

Runtime Filter Rules 可以 `grid.setFilterRules(rules)` 一次設定，不需要再呼叫 `reload()`；本機模式會立即重新篩選，`remote: true` 會回到第 1 頁並自動重新 request。`grid.getFilterRules()` 回傳目前實際規則的深層副本；沒有有效規則時回傳 `[]`。

`remote: true` 時，`%..%`、`..%`、`%..` 會分別使用既有的包含、開頭、結尾 filter icon；`!%..%`、`!..%`、`!%..` 會使用對應的否定 icon。這個映射只影響 UI，`getFilterRules()` 與遠端 request 仍保留使用者傳入的原始 `op`。

`remote: true` 的 `op: "in"` 會將陣列值序列化為逗號分隔字串：`["ZU001", "AV001"]` 送出時為 `"value":"ZU001,AV001"`。這項規則同時套用於 Excel-like filter、`setFilterRules()`、`getFilterRules()` 與 GET／POST request。

### Pivot 分析元件

所有 Pivot 元件共用同一個 `PivotEngine`，避免重複彙總資料或維護多份分析狀態。

| 元件 | 用途與能力 |
| --- | --- |
| `PivotEngine` | 以 Rows、Columns、Values、Filters 建立 Pivot view；支援 Sum、Count、Average、Min、Max、WeightedAverage、日期群組、小計、總計、calculated field、ShowAs 與可取消的非同步彙總。 |
| `PivotPanel` | 以勾選、拖放與右鍵選單設定分析欄位、排序、篩選、aggregate 和 ShowAs，並可儲存或還原 `viewDefinition`。 |
| `PivotGrid` | 繼承 FabGrid 的 virtualization、選取、剪貼簿、匯出與全螢幕；支援多層標頭、列／欄小計、群組展開收合、三態排序與原始明細檢視。 |
| `PivotChart` | 將目前 Pivot view 顯示為 Column、Bar、Line 或 Pie；可跟隨 PivotGrid 的展開／收合狀態，並與彙總儲存格雙向同步選取。 |
| `PivotSlicer` | 提供搜尋、多選、套用與清除，可與其他 Pivot 元件共用同一份篩選狀態。 |
| `PivotWorkspace` | 整合 PivotPanel、PivotGrid 與 PivotChart，提供 RWD 三欄／三列版面、Splitter、Panel 顯示切換、彙總進度、Pane 全螢幕與 nested `fg-root` theme 同步。 |

### 其他 FabUI 能力

| 類別 | 能力 |
| --- | --- |
| `fabui.EditBox` | 獨立使用文字、數字、時間、日期、清單與顏色 editor，並與 FabGrid 共用 editor definitions、格式與 popup 行為。 |
| `fabui.Gantt` | 獨立 TreeList＋Timeline 排程元件；支援階層任務、可調 Splitter、四種時間 View、進度、里程碑、相依線、拖曳／縮放、Task editor、三語系與 19 組 theme。 |
| Chart | 使用 SVG 繪製 Column、Bar、Line、Pie，可獨立使用或與 FabGrid、PivotGrid 連動；文字、背景、格線與 tooltip 跟隨 19 組 theme。 |
| 多語系 | 內建 `en`、`zh-TW`、`zh-CN` locale。 |
| 主題 | 提供多組內建主題，FabGrid、Pivot 與 Chart 共用一致的視覺變數。 |
| 框架整合 | 保留既有 Vue 2 與 FabGrid jQuery wrapper 原始碼供未來恢復；目前暫緩開發且不納入預設 build。 |

完整選項、方法、事件與範例請參考前述 [API 操作手冊](#api-操作手冊)。

## 套件與原始碼結構

### 發佈套件

`fabui.EditBox` 已納入 FabUI core bundle，不再產生獨立 EditBox bundle，也不提供 EditBox jQuery wrapper。Vue 2 與 FabGrid jQuery wrapper 目前暫緩，不納入預設 build；既有 wrapper package 與獨立 build 指令暫時保留。

| 套件 | 發佈位置 | 公開入口 |
| --- | --- | --- |
| FabUI core | `dist/fabui*.js`、`dist/fabui*.css` | `fabui.FabGrid`、`fabui.Button`、`fabui.Calendar`、`fabui.CheckBox`、`fabui.CheckGroup`、`fabui.SwitchButton`、`fabui.RadioButton`、`fabui.RadioGroup`、`fabui.FileBox`、`fabui.Form`、`fabui.Tabs`、`fabui.Tree`、`fabui.PropertyGrid`、`fabui.Tooltip`、`fabui.Menu`、`fabui.MenuButton`、`fabui.SplitButton`、`fabui.Messager`、`fabui.EditBox`、`fabui.Panel`、`fabui.Accordion`、`fabui.Window`、`fabui.Layout`、`fabui.Chart`、`fabui.pivot` 與共用基礎 API |
| FabUI Diagram | `dist/diagram.js`、`dist/diagram.min.js`、`dist/diagram.css`、`dist/diagram.min.css` | 獨立附加 `fabui.Diagram`；依賴並必須晚於 FabUI core 載入，不會併入 `fabui.*` |
| FabUI Gantt | `dist/fabui.gantt*.js`、`dist/fabui.gantt*.css` | 獨立附加 `fabui.Gantt`；依賴並必須晚於 FabUI core 載入，不會併入 `fabui.*` |
| FabUI Scheduler | `dist/fabui.scheduler*.js`、`dist/fabui.scheduler*.css` | 獨立附加 `fabui.Scheduler`；依賴並必須晚於 FabUI core 載入，不會併入 `fabui.*` |
| FabUI Lite | `dist/fabui.lite*.js`、`dist/fabui.lite*.css` | 只包含 `fabui.FabGrid`（含 `childItemsPath` TreeGrid）、`fabui.Chart`、`fabui.pivot`，以及 `Control`、editor definitions、locale、theme、popup 等必要依賴 |
| FabGrid Vue 2 wrapper（暫緩） | `packages/fabgrid-vue/` | Vue 2 `<fab-grid>` 元件；不由預設 build 產生發佈檔 |
| FabGrid jQuery wrapper（暫緩） | `packages/fabgrid-jquery/` | `$.fn.fabgrid`；不由預設 build 產生發佈檔 |
| 主題 | `dist/theme/fabui.<theme>.css`、`dist/theme/fabui.<theme>.min.css` | 各主題 CSS 與必要圖片 |

Browser global 發佈檔以 `fabui` 作為最上層 namespace：

| Namespace | 內容 |
| --- | --- |
| `fabui` | `FabGrid`、`Button`、`Calendar`、`CheckBox`、`CheckGroup`、`SwitchButton`、`RadioButton`、`RadioGroup`、`FileBox`、`Form`、`Tabs`、`Tree`、`PropertyGrid`、`Diagram`、`Tooltip`、`Menu`、`MenuButton`、`SplitButton`、`Messager`、`EditBox`、`Panel`、`Accordion`、`Window`、`Layout`、`Chart`、`Control`、`CellType`、`editorDefinitions`、`FabGridLocales` |
| `fabui.pivot` | `PivotEngine`、`PivotField`、`PivotPanel`、`PivotGrid`、`PivotChart`、`PivotSlicer`、`PivotWorkspace` 與 Pivot 列舉 |
| `fabui.FabGrid` | `Row`、`GroupRow` 等 FabGrid 專用類型 |
| `fabui.Button` | Pure JavaScript LinkButton；host 統一使用 `<a>`，提供 icon、尺寸、disabled、plain、toggle、group、theme 與 lifecycle。 |
| `fabui.Calendar` | Pure JavaScript 月曆；與 DatePopup 共用 renderer，提供年月導覽、週次、日期格式／樣式／驗證、農民曆、theme 與 lifecycle。 |
| `fabui.CheckBox` | Pure JavaScript 核取方塊；保留原生 input 的表單、label、鍵盤與 reset 語意，文字預設顯示於方塊後方，並提供尺寸、狀態、label position／align、theme 與 lifecycle。 |
| `fabui.CheckGroup` | Pure JavaScript 多選群組；直接組合 CheckBox，項目文字預設顯示於方塊後方，並提供 data、name／value、水平／垂直排列、item style、原生表單、theme 與 lifecycle。 |
| `fabui.SwitchButton` | Pure JavaScript 切換按鈕；保留原生 checkbox 的表單、label、鍵盤與 reset，提供 ON／OFF／handle、reversed、readonly、尺寸、19 組 theme 與 lifecycle。 |
| `fabui.RadioButton` | Pure JavaScript 單選按鈕；保留原生 radio 的群組、表單、label、鍵盤與 reset 語意，文字預設顯示於圓鈕後方，並提供尺寸、狀態、theme 與 lifecycle。 |
| `fabui.RadioGroup` | Pure JavaScript 單選群組；直接組合 RadioButton，項目文字預設顯示於圓鈕後方，並提供 data、name／value、水平／垂直排列、item style、原生表單、theme 與 lifecycle。 |
| `fabui.FileBox` | Pure JavaScript 檔案選擇控件；組合 EditBox 與原生 file input，保留 FileList、表單、檔案條件、瀏覽器安全限制、theme 與 lifecycle。 |
| `fabui.Form` | Pure JavaScript 表單控制器；管理原生欄位與既有 FabUI 控件，提供 Ajax／一般送出、本機／遠端 load、clear、reset、三語系且跟隨 theme 的 EasyUI 風格 constraint validation tip、dirty-only 與 lifecycle。 |
| `fabui.Tabs` | Pure JavaScript 頁籤；`draggable: false` 時使用一般箭頭游標，啟用拖曳後只有標題文字是 drag handle；提供依拖曳方向顯示於目標左側或右側的補色插入提示、半透明 drag image、tools、四方向、overflow、遠端內容、theme 與 lifecycle。 |
| `fabui.Tree` | Pure JavaScript 樹狀清單；提供 markup／data、checkbox、線條、依 theme 切換的 Tree sprite 圖示、動態 API、拖放、編輯、搜尋、鍵盤、lazy loading、theme 與 lifecycle。 |
| `fabui.PropertyGrid` | Pure JavaScript 屬性表；提供群組、兩欄自訂、排序、共用 EditBox editor、變更追蹤、遠端載入、theme 與 lifecycle。 |
| `fabui.Diagram` | Pure JavaScript SVG 圖表設計器；提供可由工具列開／關、可疊合的一般／流程圖／DFD／組織圖工具箱，各分類標題右側具備 icon-only 拖曳把手，可上下排序並透過 `toolboxStateKey` 記憶順序與展開狀態；工具箱與屬性面板都可拖曳標題切換浮動或左右停靠。兩個面板 dock 時可從朝畫布中央的透明邊緣調寬，浮動時左右邊緣可調寬、上下邊緣可調高，並記憶各自寬度與高度。另提供清楚的 20px 疊合箭頭與 47 種 SVG 圖形預覽、圖片在左／右／上方的組織圖人員卡片與 DFD Data Flow／S Curve 連線工具、置中紙張、node／connector、框選多選、群組移動／刪除、可復原的工具列「清除頁面」、工具列 JSON「下載／載入」、工具列「唯讀」切換與 pressed 狀態同步、六點輪廓連線與拖曳後自動重選最佳連線邊、工具列十字指標任意點拖曳連線、可拖曳線條、二次／三次貝茲曲線控制與四種箭頭方向、node／connector 雙擊就地文字編輯（圖形內透明多行 EditBox，任何 zoom 與置中偏移下皆對齊圖形）、node 屬性區的超連結與單擊／雙擊觸發方式、一般網址新分頁開啟與可信任 `javascript:` URL 當頁執行、八方向縮放、格線、整頁／內容自動縮放、屬性、歷程、JSON／SVG／PNG 匯出、分為 JSON 下載／載入、輸出／展示、復原／編輯、連線、工具箱／屬性／唯讀五組並以垂直線分隔的上方工具列、與畫布右鍵共用的 PNG／SVG 匯出、同頁單頁列印及投影片展示（列印不開新分頁、預設無網格及 header／footer，列印預覽方向跟隨做圖紙張）、右下角完整編輯器「全螢幕」、theme 與 lifecycle。唯讀時主工具列維持可見以便解除鎖定，編輯按鈕停用、工具箱與屬性區隱藏，下載、縮放、格線、全螢幕、匯出、列印及投影片展示等檢視功能保留。滑鼠位於繪圖區時，滾輪向上放大、向下縮小，並以指標位置為縮放中心。點選圖形或連線後可直接按 `Delete`／`Backspace` 刪除，不必再點 Diagram 外框；進入屬性或就地 EditBox 後仍保留輸入欄位的原生按鍵。圖形不必預先選取，第一次直接點文字就會依設定的單擊或雙擊觸發超連結，且不進入文字編輯模式；圖形文字以外仍可雙擊編輯。Diagram 的刪除、復原與方向鍵捷徑只在焦點不位於屬性 EditBox、搜尋、就地文字編輯或其他互動控件時執行，避免輸入 Backspace／Delete 時誤刪圖形。`javascript:` 可執行任意頁面程式，只能搭配可信任的 Diagram JSON 與超連結內容。兩種模式都會先將完整紙張依可用空間放大置中，完整編輯器全螢幕仍可在 `minZoom` 至 `maxZoom` 間繼續手動縮放，離開後還原原本縮放與捲動位置。單擊畫布空白處會在屬性面板顯示紙張尺寸、方向與吸附間距，預設 A4 橫向，支援 A3／A4／A5／Letter／Legal、直向／橫向與 JSON `page` 保存。 |
| `fabui.Tooltip` | Pure JavaScript 提示；提供四方向、HTML、滑鼠追蹤、延遲、viewport 定位、theme 與 lifecycle。 |
| `fabui.Menu` | Pure JavaScript context／inline menu；提供巢狀 submenu、icon、separator、disabled、鍵盤、runtime item API、theme 與 lifecycle。 |
| `fabui.MenuButton` | Pure JavaScript 下拉選單按鈕；組合既有 Button 與 Menu，提供 hover／click、對齊、箭頭、鍵盤、theme 與 lifecycle。 |
| `fabui.SplitButton` | Pure JavaScript 分割按鈕；組合既有 MenuButton，主區域執行動作，箭頭區顯示 Menu。 |
| `fabui.Messager` | Pure JavaScript singleton 訊息服務；提供 Alert、Confirm、Prompt、Toast、Progress、theme 與 lifecycle。 |
| `fabui.EditBox` | FabUI core 直接提供；使用方式為 `new fabui.EditBox(...)` |
| `fabui.Panel` | Pure JavaScript 內容容器；提供 Header、Footer、Tools、狀態過渡動畫、載入與 lifecycle。 |
| `fabui.Accordion` | Pure JavaScript 摺疊面板集合；直接組合既有 Panel，提供展開／收合箭頭與過渡動畫、單一／多重展開、動態 Panel、三方向 header、遠端內容、鍵盤、三語系、19 組 theme 與 lifecycle。 |
| `fabui.Gantt` | 獨立 pure JavaScript Gantt 附加元件；提供階層 Task list、Timeline、四種 View、相依線、進度、里程碑、拖曳／縮放、鍵盤、三語系與 19 組 theme，toolbar 與 editor 重用既有 Button、Window 與 EditBox。 |
| `fabui.Scheduler` | 獨立 pure JavaScript 排程附加元件；提供 Day、Work Week、Week、Month、Year、Agenda、Timeline、本機 CRUD、resource color、拖曳／調整時間、鍵盤、三語系與 19 組 theme，編輯器重用既有 Window、EditBox、CheckBox 與 Button。 |
| `fabui.Window` | Pure JavaScript 浮動視窗；提供拖曳、放開滑鼠才提交的縮放預覽、Modal、可對準單一目標矩形的最小化動畫、`iconCls: 'icon-xxx'` 標題 icon 與 lifecycle。 |
| `fabui.Layout` | 以 `fabui.Panel` 組成 north／south／east／west／center 五區、可拖曳 Splitter，以及同步 edge／center／collapsed bar 的收起展開動畫。 |

Diagram 生產製造流程 Demo 的開立製令、倉庫領料、生產工序與完工入庫使用等寬高的圓形 DFD Process 原型，不使用一般圓角方形。

Diagram 的工具箱與屬性面板皆可獨立浮動或停靠於左／右兩側，也可同時停靠同一側。`sameSideDockMode: 'tabs'`（預設）會共用一個 `fabui.Tabs` 區域，只顯示目前選取的面板，工具箱／屬性 tab 標籤固定置於下方；`sameSideDockMode: 'stacked'` 則在同一側欄將工具箱置於上方、屬性置於下方並同時顯示。可用 `setSameSideDockMode()` 即時切換。兩者分居左右或任一面板浮動時仍各自顯示。停靠時內側透明 6px 邊緣可調寬，並顯示 1px 面板框線；浮動時左右兩側可調寬、上下兩側可調高且維持完整外框，不顯示額外 splitter 色帶。設定 `toolboxStateKey` 後，會同時記住兩個面板的顯示、浮動／停靠、停靠側、浮動位置、各自寬度與高度、同側排列模式、作用中 tab，以及原有分類順序與展開狀態。

`toolboxStateKey` 也會保存完整做圖進度：目前紙張、nodes 與 connectors 在每次新增、修改、移動、縮放、刪除、清除、載入、undo 或 redo 後立即寫入 `localStorage`；下次開啟相同 key 時自動載入最後進度。Demo 的「還原範例」會將範例內容重新保存為目前進度。

工具箱與屬性面板同時浮動且彼此重疊時，點擊其中一個面板的標題、內容、控件或尺寸調整邊緣，會將該面板與 resizer 一起提到最上層。

Diagram 上方工具列由左至右固定為「下載／載入」、「匯出／列印」、「復原／編輯」、「直線／直角線／弧線／S 線／連線」、「工具箱／屬性／唯讀」五組；四顆 icon-only 類型按鈕只顯示線型、不帶箭頭，互斥選取且預設直角線，「連線」負責開關連線模式。實際 connector 預設在終點顯示箭頭，由左向右連接時為向右箭頭。連線右側保留垂直分隔線。

Connector 文字標籤顯示在線條中點上方，後方使用目前 Diagram 紙張底色遮住線條，讓文字下方再清楚接續 connector；標籤遮罩不改變路徑、控制點、JSON 或雙擊就地編輯行為。

選取圖形或連線後，屬性面板可調整 8～96 的文字大小，並以 FabUI toggle 按鈕切換粗體、斜體、底線與刪除線；格式會保存於 Diagram JSON，並支援 undo／redo。

Diagram 右下角的「縮放／符合／格線／投影片展示／全螢幕」檢視工具列可從縮放百分比或空白處拖曳；「投影片展示」與「全螢幕」使用 icon-only FabUI Button，分別採用 projector screen 與 fullscreen icon，並以 tooltip／ARIA 顯示目前進入或離開狀態。兩顆按鈕固定相鄰且位置會限制在 Diagram 範圍內。設定 `toolboxStateKey` 後會一併記憶位置，重新載入即還原；所有按鈕與右鍵功能保持不變。

Diagram 選取圖形後，屬性面板會將 `X`／`Y` 並排於同一列，並將「寬度」／「高度」並排於下一列；文字、超連結、顏色及其他屬性仍維持原有順序。單擊做圖區空白處時，同一屬性面板改為顯示紙張尺寸、方向與「吸附間距」，變更後立即更新格線與 snap，並透過 JSON `page.gridSize` 保存；設定 `toolboxStateKey` 時，紙張尺寸、方向、寬高、底色與吸附間距也會跨重新載入還原。

拖曳單一或多個圖形時，若未自訂折點的相連直角線只差少量距離即可成為水平或垂直直線，Diagram 會自動微調整組圖形的位置完成對齊；超過吸附範圍或已手動調整控制點的連線不受影響。

同時選取兩個以上圖形時會顯示整組虛線外框與四角縮放控制點；拖曳控制點會以群組中心等比例調整所有圖形的尺寸、位置與彼此間距，整組內的連線控制點同步縮放，並支援 undo／redo。

同時選取兩個以上圖形時，屬性面板會顯示可批次調整的共用視覺屬性：文字大小、粗體、斜體、底線、刪除線、寬度、高度、填滿與框線。不同值以空白與 `—` 混合狀態顯示，修改後一次套用到全部選取圖形並保留 undo／redo；文字、超連結與 X／Y 不會被批次覆寫。

紙張放大到超過 viewport 可視範圍後，可在沒有圖形、線條或控制點的空白處按住滑鼠左鍵拖曳平移做圖區；拖曳期間使用 grabbing 游標，`pointercancel` 會還原原本捲動位置。紙張未超出時仍使用原本框選；在放大狀態按住 `Shift`／`Ctrl`／`Cmd` 拖曳也可改為框選。

Diagram Demo 的初始做圖區使用 draw.io `man-process.json` 的生產製造流程內容，並依 `man-process.drawio.png` 參考圖在無格線的 A4 橫向紙張內重現 14 個文字／流程／DFD Data Store 圖形、灰階外觀、相對位置及 11 條有效業務連線；頂端「生產製造流程」標題使用 28px 與底線，其中「客戶訂單 → 開立製令」連線顯示「Email或傳真」標籤，兩條垂直線使用 `straight`，其餘九條平滑轉折線使用依端點邊向進出的 `sCurve`。Demo 不依賴外部下載檔案，使用者仍可由檢視工具列開啟格線。

`fabui.version` 使用 `YYYY.M.D` 格式，執行 build 時會依本機日期自動產生。

預設 `npm run build` 產生 FabUI core 四個主檔、`dist/theme/` 與四個獨立 `fabui.gantt.*`；`npm run build:gantt` 可在已有 core 時單獨重建 Gantt。`npm run build:scheduler` 獨立產生四個 `fabui.scheduler.*` 檔案，不會將 Scheduler 寫入 core 入口；`npm run build:lite` 獨立產生四個 FabUI Lite 精簡檔，內容為 FabGrid、內建 TreeGrid、Pivot、Chart 與必要依賴，不包含 Button、EditBox 公開控件、Diagram、Window、Menu、Tabs 等其他控件。所有 build 指令只產生 browser global JavaScript、壓縮 JavaScript、CSS 與壓縮 CSS，不產生任何 `.esm.*` 檔案。Vue 2 與 FabGrid jQuery wrapper 暫緩，不再由預設 build 或 core smoke gate 編譯／驗證。EditBox jQuery wrapper 已移除，`dist/` 也不再產生獨立 `dist/editbox.*`。

Codex build 指令可用半形逗號一次指定多個範圍，逗號左右不可有空白，例如 `build fabui,diagram min` 會依序重建 FabUI core 與 Diagram，並只保留兩個範圍的 `.min.*` 輸出。可組合 `fabui`、`lite`、`diagram`、`gantt`、`scheduler`、`theme`；`all` 與 `clear` 必須單獨使用。未加逗號的既有 `build`、`build diagram`、`build all min` 等格式保持不變。

### 原始碼目錄

| 路徑 | 用途 |
| --- | --- |
| `src/fabui.js`、`src/fabui.css` | FabUI core 的 JavaScript 與 CSS 公開入口 |
| `src/core/` | Control 基礎類別、host element 與 instance registry |
| `src/button/` | `fabui.Button` 核心與 EasyUI Default 基準的多主題樣式 |
| `src/calendar/` | `fabui.Calendar` 公開 class 與嵌入式版面樣式；日曆 renderer 共用 `src/editbox/date-popup.js` |
| `src/checkbox/` | `fabui.CheckBox` 核心、原生表單 lifecycle、label layout 與多主題樣式 |
| `src/checkgroup/` | `fabui.CheckGroup` 核心、CheckBox 組合、水平／垂直排列、原生表單 lifecycle 與多主題樣式 |
| `src/switchbutton/` | `fabui.SwitchButton` 核心、原生 checkbox／表單 lifecycle、滑動軌道與 19 組 EasyUI 對應主題 |
| `src/radiobutton/` | `fabui.RadioButton` 核心、原生 radio 群組／表單 lifecycle、label layout 與多主題樣式 |
| `src/radiogroup/` | `fabui.RadioGroup` 核心、RadioButton 組合、水平／垂直排列與原生表單 lifecycle |
| `src/filebox/` | `fabui.FileBox` 核心、EditBox 組合、原生 FileList／表單 lifecycle 與多主題樣式 |
| `src/grid/` | FabGrid 資料、rendering、virtualization、選取、編輯、篩選、TreeGrid、拖曳與匯出 |
| `src/editbox/` | `fabui.EditBox`、各 editor 實作、FabGrid 共用的 DatePopup／ComboPopup／ColorPopup、共用 definitions 與樣式 |
| `src/menu/` | `fabui.Menu` 核心、EasyUI Default 視覺基準、鍵盤、popup lifecycle 與多主題樣式 |
| `src/menubutton/` | `fabui.MenuButton` 核心與樣式；組合 `fabui.Button` 與 `fabui.Menu` |
| `src/splitbutton/` | `fabui.SplitButton` 核心與樣式；組合既有 `fabui.MenuButton` |
| `src/messager/` | `fabui.Messager` singleton、Toast／訊息內容與 Progress 樣式 |
| `src/panel/` | `fabui.Panel` 核心與 Material Teal 基準的多主題樣式 |
| `src/accordion/` | `fabui.Accordion` 集合管理、Panel 組合、展開／收合箭頭與動畫、鍵盤及 19 組 EasyUI 對應主題 |
| `src/gantt/` | 獨立 `fabui.Gantt` TreeList、Timeline、相依線、互動、編輯器與 19 組主題；公開 source 入口為 `src/fabui.gantt.js` |
| `src/scheduler/` | 獨立 `fabui.Scheduler` views、資料、互動、編輯器與 19 組主題；公開 source 入口為 `src/fabui.scheduler.js`／`.css` |
| `src/layout/` | `fabui.Layout` 五區幾何、Splitter、收合協調與多主題樣式 |
| `src/window/` | `fabui.Window` 核心與 Material Teal 基準的多主題樣式 |
| `src/editor/` | 舊 editor definitions import 的相容入口 |
| `src/chart/` | Pure JavaScript SVG Chart renderer |
| `src/pivot/` | PivotEngine、PivotPanel、PivotGrid、PivotChart、PivotSlicer 與 PivotWorkspace |
| `src/locales/` | `en`、`zh-TW`、`zh-CN` 語系檔 |
| `src/theme/` | 內建主題 CSS 與圖片資源 |
| `src/tabs/` | `fabui.Tabs` 核心、EasyUI Default 視覺基準與多主題樣式 |
| `src/tree/` | `fabui.Tree` 核心、階層資料、拖放／編輯／非同步載入與多主題樣式 |
| `src/propertygrid/` | `fabui.PropertyGrid` 核心、群組、編輯、變更追蹤、遠端載入與多主題樣式 |
| `src/diagram/` | `fabui.Diagram` SVG renderer、工具箱、互動、歷程、JSON／SVG 匯出與多主題樣式 |
| `src/tooltip/` | `fabui.Tooltip` 核心、EasyUI Default 視覺基準與多主題樣式 |
| `packages/fabgrid-vue/` | FabGrid Vue 2 wrapper、型別與獨立輸出 |
| `packages/fabgrid-jquery/` | FabGrid jQuery wrapper、型別與獨立輸出 |
| `build/` | FabUI core（包含 `fabui.EditBox`）的預設 build／smoke，以及暫時保留的 Vue 2 與 FabGrid jQuery wrapper 獨立 build scripts |
| `demo/` | Source-mode 開發頁面與 build-mode 正式 Demo |
| `docs/` | API 操作手冊 |
| `test/` | Node.js 自動測試 |

後續功能規劃請參考 [TODO](./TODO.md)。

## 本機開發

```bash
npm run serve
```

開啟 `http://127.0.0.1:4173/demo/grid.html` 查看 build-mode Demo，或開啟 `http://127.0.0.1:4173/demo/dev-grid.html` 查看 source-mode Demo。若需要重新產生發佈檔，請執行：

```bash
npm run build
```

此指令編譯 FabUI core、主題與獨立 Gantt；不會把 Gantt 併入 core，也不會編譯 Vue 2／FabGrid jQuery wrapper，並且不產生 ESM 檔案。

若已有 core 且只要重新產生 Gantt，執行 `npm run build:gantt`；其輸出固定為 `dist/fabui.gantt.*`。

若要產生獨立 Scheduler 發佈檔，執行 `npm run build:scheduler`；其輸出固定為 `dist/fabui.scheduler.*`，且不會將 Scheduler 併入 `dist/fabui.*`。可再執行 `npm run smoke:scheduler` 驗證 core-first 掛載與主要 views。

若只要重新產生 `fabui.lite.*`，可執行 `npm run build:lite`；此指令不會清除或重建完整的 `fabui.*`。

## 專案方向

FabGrid 保持核心 pure JavaScript 與效能優先；Vue 2 與 FabGrid jQuery wrapper 目前暫緩，未來若恢復仍只負責 options、events、methods 與 lifecycle 對應，不接管 cell rendering。
