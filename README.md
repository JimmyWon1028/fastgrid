<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

# FabGrid

## FabGrid 介紹

FabGrid 名稱中的 **Fab** 是 **Fabulous** 的縮寫，意思是「出色、令人驚豔」。這個名稱代表專案希望提供兼具效能、實用性與良好開發體驗的資料表元件。

FabUI 是以 pure JavaScript 開發的前端 UI 元件庫，不依賴任何前端框架。主要元件包含 FabGrid、`fabui.Button`、`fabui.Calendar`、`fabui.Tabs`、`fabui.Tree`、`fabui.Tooltip`、`fabui.Menu`、`fabui.MenuButton`、`fabui.SplitButton`、`fabui.Messager`、`fabui.EditBox`、`fabui.Panel`、`fabui.Window`、`fabui.Layout`、Chart，以及 PivotPanel、PivotGrid、PivotChart 與 PivotWorkspace。

FabGrid 是以效能為優先的資料表元件，透過水平與垂直 virtualization 處理大量資料。內建凍結欄、TreeGrid、排序、搜尋、編輯、群組、分頁、JSON 匯入匯出，以及 CSV、Excel 匯出等常用功能。

`fabui.EditBox` 使用單一 class 提供文字、數字、日期、清單與顏色編輯，並可作為 FabGrid 的儲存格編輯器使用。日期、清單與顏色 popup 分別和 FabGrid 共用內部 `DatePopup`／`ComboPopup`／`ColorPopup`，統一採用 EditBox 的 DOM、互動與樣式。

日期 editor 可設定 `showLunar: true`，在共用 DatePopup 的國曆日期下方顯示農曆日期；預設關閉。

`fabui.Calendar` 是可獨立放在頁面中的月曆，與 Date EditBox／FabGrid 日期 editor 共用同一個 DatePopup 日曆 renderer、月份選單、農民曆與主題樣式；支援週次、`formatter`、`styler`、`validator`、三語系與 16 組 theme。

Date EditBox 的 Calendar 預設從外層 `fg-theme-*` class 繼承，也可用 `theme` option 或 `setTheme(theme)` 覆寫；FabGrid 的共用 DatePopup 會自動跟隨 Grid theme。色彩映射參考本機 `res/themes/*/calendar.css`，正式 source 與 build 不依賴 `res/`。

Pivot 元件共用同一個 PivotEngine。PivotPanel 用來設定分析欄位，PivotGrid 顯示多階列／欄彙總，PivotChart 將分析結果呈現為直條圖、橫條圖、折線圖或圓餅圖。PivotWorkspace 則將這些元件整合成完整的資料分析工作區。

Chart 是以 SVG 繪製的圖表元件，可獨立使用，也能與 FabGrid 或 PivotGrid 連動。

## 文件與 Demo

### 線上 Demo

- [線上 FabGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/grid.html)
- [線上 TreeGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/treegrid.html)
- [線上 Grid / Grid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-grid.html)
- [線上 Grid / TreeGrid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-treegrid.html)
- [線上 Chart Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-chart.html)
- [線上 PivotGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot.html)
- [線上 PivotWorkspace Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot-workspace.html)

### 開發測試

- [Demo 索引](./demo/index.html)
- 所有 source-mode 與 build-mode Demo 的預設主題統一為 `default`，仍可從各頁工具列切換其他 theme。
- `fabui.Button` Demo：[source-mode 開發版](./demo/dev-button.html) 與 [build-mode 正式版](./demo/button.html)。
- `fabui.Calendar` Demo：[source-mode 開發版](./demo/dev-calendar.html) 與 [build-mode 正式版](./demo/calendar.html)。
- `fabui.Tabs` Demo：[source-mode 開發版](./demo/dev-tabs.html) 與 [build-mode 正式版](./demo/tabs.html)。
- `fabui.Tree` Demo：[source-mode 開發版](./demo/dev-tree.html) 與 [build-mode 正式版](./demo/tree.html)。
- `fabui.Tooltip` Demo：[source-mode 開發版](./demo/dev-tooltip.html) 與 [build-mode 正式版](./demo/tooltip.html)。
- `fabui.Menu` Demo：[source-mode 開發版](./demo/dev-menu.html) 與 [build-mode 正式版](./demo/menu.html)。
- `fabui.MenuButton` Demo：[source-mode 開發版](./demo/dev-menubutton.html) 與 [build-mode 正式版](./demo/menubutton.html)。
- `fabui.SplitButton` Demo：[source-mode 開發版](./demo/dev-splitbutton.html) 與 [build-mode 正式版](./demo/splitbutton.html)。
- `fabui.Messager` Demo：[source-mode 開發版](./demo/dev-messager.html) 與 [build-mode 正式版](./demo/messager.html)。
- `fabui.EditBox` 本機 Demo：[source-mode 開發版](./demo/dev-editbox.html) 與 [build-mode 正式版](./demo/editbox.html)。
- `fabui.EditBox` jQuery Demo：[source-mode 開發版](./demo/dev-editbox-jquery.html) 與 [build-mode 正式版](./demo/editbox-jquery.html)。
- `fabui.Panel` Demo：[source-mode 開發版](./demo/dev-panel.html) 與 [build-mode 正式版](./demo/panel.html)。
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
- [`fabui.Tabs` API 操作手冊](./docs/tabs-api.md)
- [`fabui.Tree` API 操作手冊](./docs/tree-api.md)
- [`fabui.Tooltip` API 操作手冊](./docs/tooltip-api.md)
- [`fabui.Menu` API 操作手冊](./docs/menu-api.md)
- [`fabui.MenuButton` API 操作手冊](./docs/menubutton-api.md)
- [`fabui.SplitButton` API 操作手冊](./docs/splitbutton-api.md)
- [`fabui.Messager` API 操作手冊](./docs/messager-api.md)
- [`fabui.EditBox` API 操作手冊](./docs/editbox-api.md)
- [`fabui.Panel` API 操作手冊](./docs/panel-api.md)
- [`fabui.Window` API 操作手冊](./docs/window-api.md)
- [`fabui.Layout` API 操作手冊](./docs/layout-api.md)
- [`fabui.EditBox` jQuery Wrapper API](./docs/editbox-jquery-api.md)
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

`fabui.EditBox` 的 jQuery wrapper 位於 `packages/fabeditbox-jquery`，註冊 `$.fn.fabeditbox`，並使用 FabUI core 已公開的 `fabui.EditBox`：

```js
$('#amount').fabeditbox({
  editor: 'number',
  precision: 2
});

$('#amount').fabeditbox('setValue', 1280.5);
var value = $('#amount').fabeditbox('getValue');
```

FabGrid cell editor、Search Row 與 `fabui.EditBox` 的自訂 icon 都統一使用 `icons: [{ iconCls, title, ariaLabel, text, width, align, keepFocus, onClick }]`；完整範例與相容欄位請見 [EditBox API](./docs/editbox-api.md)。

也支援 EasyUI 風格的宣告式初始化：

```html
<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search'"
  style="width:300px">

<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search',width:300">

<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search',width:'300px'">
```

Browser global 依序載入 jQuery、`dist/fabui.min.js`、`dist/wrapper/fabeditbox-jquery.min.js` 後，會在 DOM ready 自動解析 `.fab-editbox`；動態加入的內容可呼叫 `fabuiEditBoxJQuery.parse(container)`。

## 主要能力

### FabGrid

| 類別 | 能力 |
| --- | --- |
| 效能 | 固定列高與欄寬的雙向 virtualization，只渲染可視範圍，適合大量資料。 |
| 資料來源 | 支援本機 Array，以及 `remote: true` 的遠端分頁、排序、搜尋與欄位篩選。 |
| 表格版面 | 支援左右凍結欄、列號欄、欄寬調整、欄位顯示切換、Footer aggregate、交替列背景與 Grid 全螢幕。 |
| 排序與篩選 | 提供欄位排序、Quick Search、Search Row 與 Excel-like 值篩選；`allowFiltering` 可統一開關欄位篩選。 |
| 群組與 TreeGrid | 支援 1 至 3 階群組、aggregate、群組收合，以及 `childItemsPath` TreeGrid、節點展開／收合、同層排序與階層鍵盤導覽。 |
| 資料列拖曳 | 支援 Grid 內重排、跨 Grid 移動，以及 TreeGrid 節點的 `before`、`inside`、`after` 階層調整；欄位、資料列與 PivotPanel 欄位拖曳的插入指示線統一使用 55% 半透明，資料列指示線的右邊界限制在實際欄位區域內。 |
| 選取與剪貼簿 | 支援 `Cell`、連續矩形 `CellRange`、滑鼠拖曳、Shift 延伸、鍵盤導覽與 TSV 複製。 |
| 編輯與驗證 | 內建 `text`、`number`、`date`、`combo`、`color` editor，支援遮罩、同步／非同步驗證與自訂 editor。 |
| 顯示自訂 | 提供 formatter、`formatItem`、`cellTemplate`、Row／GroupRow、`hitTest()` 與完整事件 API。 |
| 匯入與匯出 | 支援 JSON 匯入／匯出、CSV 與 XLSX 匯出；Excel 可保留格式、凍結窗格、篩選、群組、Footer 與隱藏欄位。 |
| 元件生命週期 | `fabui.Control.getControl()` 可取得既有 instance；managed DOM listener 會在互動結束或 `dispose()` 時解除。 |
| Popup 行為 | 右鍵選單、Filter、欄位選擇器與 editor popup 都支援 `Escape` 及點擊外部關閉，不會提交未確認內容。 |

### Pivot 分析元件

所有 Pivot 元件共用同一個 `PivotEngine`，避免重複彙總資料或維護多份分析狀態。

| 元件 | 用途與能力 |
| --- | --- |
| `PivotEngine` | 以 Rows、Columns、Values、Filters 建立 Pivot view；支援 Sum、Count、Average、Min、Max、WeightedAverage、日期群組、小計、總計、calculated field、ShowAs 與可取消的非同步彙總。 |
| `PivotPanel` | 以勾選、拖放與右鍵選單設定分析欄位、排序、篩選、aggregate 和 ShowAs，並可儲存或還原 `viewDefinition`。 |
| `PivotGrid` | 繼承 FabGrid 的 virtualization、選取、剪貼簿、匯出與全螢幕；支援多層標頭、列／欄小計、群組展開收合、三態排序與原始明細檢視。 |
| `PivotChart` | 將目前 Pivot view 顯示為 Column、Bar、Line 或 Pie；可跟隨 PivotGrid 的展開／收合狀態，並與彙總儲存格雙向同步選取。 |
| `PivotSlicer` | 提供搜尋、多選、套用與清除，可與其他 Pivot 元件共用同一份篩選狀態。 |
| `PivotWorkspace` | 整合 PivotPanel、PivotGrid 與 PivotChart，提供 RWD 三欄／三列版面、Splitter、Panel 顯示切換、彙總進度與 Pane 全螢幕。 |

### 其他 FabUI 能力

| 類別 | 能力 |
| --- | --- |
| `fabui.EditBox` | 獨立使用文字、數字、日期、清單與顏色 editor，並與 FabGrid 共用 editor definitions、格式與 popup 行為。 |
| Chart | 使用 SVG 繪製 Column、Bar、Line、Pie，可獨立使用或與 FabGrid、PivotGrid 連動。 |
| 多語系 | 內建 `en`、`zh-TW`、`zh-CN` locale。 |
| 主題 | 提供多組內建主題，FabGrid、Pivot 與 Chart 共用一致的視覺變數。 |
| 框架整合 | 提供 Vue 2 與 jQuery wrapper，包裝既有 pure JavaScript core，不接管資料格渲染。 |

完整選項、方法、事件與範例請參考前述 [API 操作手冊](#api-操作手冊)。

## 套件與原始碼結構

### 發佈套件

`fabui.EditBox` 已納入 FabUI core bundle，不再產生獨立 EditBox bundle。各框架 wrapper 維持分開發佈。

| 套件 | 發佈位置 | 公開入口 |
| --- | --- | --- |
| FabUI core | `dist/fabui*.js`、`dist/fabui*.css` | `fabui.FabGrid`、`fabui.Button`、`fabui.Calendar`、`fabui.Tabs`、`fabui.Tree`、`fabui.Tooltip`、`fabui.Menu`、`fabui.MenuButton`、`fabui.SplitButton`、`fabui.Messager`、`fabui.EditBox`、`fabui.Panel`、`fabui.Window`、`fabui.Layout`、`fabui.Chart`、`fabui.pivot` 與共用基礎 API |
| FabGrid Vue 2 wrapper | `packages/fabgrid-vue/dist/`、`dist/wrapper/fabgrid-vue*.js` | Vue 2 `<fab-grid>` 元件 |
| FabGrid jQuery wrapper | `packages/fabgrid-jquery/dist/`、`dist/wrapper/fabgrid-jquery.min.js` | `$.fn.fabgrid` |
| `fabui.EditBox` jQuery wrapper | `packages/fabeditbox-jquery/dist/`、`dist/wrapper/fabeditbox-jquery.min.js` | `$.fn.fabeditbox` |
| 主題 | `dist/theme/` | 各主題 CSS 與必要圖片 |

Browser global 與 ES module 都以 `fabui` 作為最上層 namespace：

| Namespace | 內容 |
| --- | --- |
| `fabui` | `FabGrid`、`Button`、`Calendar`、`Tabs`、`Tree`、`Tooltip`、`Menu`、`MenuButton`、`SplitButton`、`Messager`、`EditBox`、`Panel`、`Window`、`Layout`、`Chart`、`Control`、`CellType`、`editorDefinitions`、`FabGridLocales` |
| `fabui.pivot` | `PivotEngine`、`PivotField`、`PivotPanel`、`PivotGrid`、`PivotChart`、`PivotSlicer`、`PivotWorkspace` 與 Pivot 列舉 |
| `fabui.FabGrid` | `Row`、`GroupRow` 等 FabGrid 專用類型 |
| `fabui.Button` | Pure JavaScript LinkButton；提供 icon、尺寸、disabled、plain、toggle、group、theme 與 lifecycle。 |
| `fabui.Calendar` | Pure JavaScript 月曆；與 DatePopup 共用 renderer，提供年月導覽、週次、日期格式／樣式／驗證、農民曆、theme 與 lifecycle。 |
| `fabui.Tabs` | Pure JavaScript 頁籤；提供動態 panels、滑鼠拖曳排序開關、依拖曳方向顯示於目標左側或右側的補色插入提示、半透明 drag image、tools、四方向、overflow、遠端內容、theme 與 lifecycle。 |
| `fabui.Tree` | Pure JavaScript 樹狀清單；提供 markup／data、checkbox、線條、圖示、動態 API、拖放、編輯、搜尋、鍵盤、lazy loading、theme 與 lifecycle。 |
| `fabui.Tooltip` | Pure JavaScript 提示；提供四方向、HTML、滑鼠追蹤、延遲、viewport 定位、theme 與 lifecycle。 |
| `fabui.Menu` | Pure JavaScript context／inline menu；提供巢狀 submenu、icon、separator、disabled、鍵盤、runtime item API、theme 與 lifecycle。 |
| `fabui.MenuButton` | Pure JavaScript 下拉選單按鈕；組合既有 Button 與 Menu，提供 hover／click、對齊、箭頭、鍵盤、theme 與 lifecycle。 |
| `fabui.SplitButton` | Pure JavaScript 分割按鈕；組合既有 MenuButton，主區域執行動作，箭頭區顯示 Menu。 |
| `fabui.Messager` | Pure JavaScript singleton 訊息服務；提供 Alert、Confirm、Prompt、Toast、Progress、theme 與 lifecycle。 |
| `fabui.EditBox` | FabUI core 直接提供；使用方式為 `new fabui.EditBox(...)` |
| `fabui.Panel` | Pure JavaScript 內容容器；提供 Header、Footer、Tools、狀態過渡動畫、載入與 lifecycle。 |
| `fabui.Window` | Pure JavaScript 浮動視窗；提供拖曳、縮放、Modal、狀態動畫、`iconCls: 'icon-xxx'` 標題 icon 與 lifecycle。 |
| `fabui.Layout` | 以 `fabui.Panel` 組成 north／south／east／west／center 五區、可拖曳 Splitter，以及同步 edge／center／collapsed bar 的收起展開動畫。 |

`fabui.version` 使用 `YYYY.M.D` 格式，執行 build 時會依本機日期自動產生。

目前發佈驗證基準為 2026-07-18：`fabui.version` 是 `2026.7.18`，FabUI core、Vue 2 wrapper、jQuery wrapper 與 EditBox jQuery wrapper 均已完成 build，285／285 項自動測試及完整 smoke test 全部通過。`dist/` 僅保留六個 FabUI 主檔與 theme／wrapper 輸出，不再產生獨立 `dist/editbox.*`。

### 原始碼目錄

| 路徑 | 用途 |
| --- | --- |
| `src/fabui.js`、`src/fabui.css` | FabUI core 的 JavaScript 與 CSS 公開入口 |
| `src/core/` | Control 基礎類別、host element 與 instance registry |
| `src/button/` | `fabui.Button` 核心與 EasyUI Default 基準的多主題樣式 |
| `src/calendar/` | `fabui.Calendar` 公開 class 與嵌入式版面樣式；日曆 renderer 共用 `src/editbox/date-popup.js` |
| `src/grid/` | FabGrid 資料、rendering、virtualization、選取、編輯、篩選、TreeGrid、拖曳與匯出 |
| `src/editbox/` | `fabui.EditBox`、各 editor 實作、FabGrid 共用的 DatePopup／ComboPopup／ColorPopup、共用 definitions 與樣式 |
| `src/menu/` | `fabui.Menu` 核心、EasyUI Default 視覺基準、鍵盤、popup lifecycle 與多主題樣式 |
| `src/menubutton/` | `fabui.MenuButton` 核心與樣式；組合 `fabui.Button` 與 `fabui.Menu` |
| `src/splitbutton/` | `fabui.SplitButton` 核心與樣式；組合既有 `fabui.MenuButton` |
| `src/messager/` | `fabui.Messager` singleton、Toast／訊息內容與 Progress 樣式 |
| `src/panel/` | `fabui.Panel` 核心與 Material Teal 基準的多主題樣式 |
| `src/layout/` | `fabui.Layout` 五區幾何、Splitter、收合協調與多主題樣式 |
| `src/window/` | `fabui.Window` 核心與 Material Teal 基準的多主題樣式 |
| `src/editor/` | 舊 editor definitions import 的相容入口 |
| `src/chart/` | Pure JavaScript SVG Chart renderer |
| `src/pivot/` | PivotEngine、PivotPanel、PivotGrid、PivotChart、PivotSlicer 與 PivotWorkspace |
| `src/locales/` | `en`、`zh-TW`、`zh-CN` 語系檔 |
| `src/theme/` | 內建主題 CSS 與圖片資源 |
| `src/tabs/` | `fabui.Tabs` 核心、EasyUI Default 視覺基準與多主題樣式 |
| `src/tree/` | `fabui.Tree` 核心、階層資料、拖放／編輯／非同步載入與多主題樣式 |
| `src/tooltip/` | `fabui.Tooltip` 核心、EasyUI Default 視覺基準與多主題樣式 |
| `packages/fabgrid-vue/` | FabGrid Vue 2 wrapper、型別與獨立輸出 |
| `packages/fabgrid-jquery/` | FabGrid jQuery wrapper、型別與獨立輸出 |
| `packages/fabeditbox-jquery/` | `fabui.EditBox` jQuery wrapper、型別與獨立輸出 |
| `build/` | FabUI core（包含 `fabui.EditBox`）、wrapper 的 build 與 smoke scripts |
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

## 專案方向

FabGrid 保持核心 pure JavaScript 與效能優先；現有 Vue 2 與 jQuery wrapper 僅負責 options、events、methods 與 lifecycle 對應，不接管 cell rendering。
