<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

# FabGrid

FabUI 提供 pure JavaScript FabGrid 與 SVG Chart。FabGrid 支援雙向 virtualization、凍結欄、排序、搜尋、編輯、群組、分頁與 CSV / Excel 匯出；Chart 支援直條圖、橫條圖、折線圖與圓餅圖。

## 文件與 Demo

- [FabGrid API 操作手冊](./docs/fabgrid-api.md)：完整的建構選項、欄位設定、方法、事件、遠端資料協定與匯出說明。
- [Chart API 操作手冊](./docs/chart-api.md)
- [Vue 2 Wrapper API](./docs/vue-api.md)
- [jQuery Wrapper API](./docs/jquery-api.md)
- [線上 FabGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/)
- [線上 Chart Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-chart.html)
- [線上 jQuery Demo](https://jimmywon1028.github.io/fabgrid/demo/demo-jquery.html)
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

- `demo/js/demo-jquery.js`：jQuery 專用 adapter，集中 `$.fn.fabgrid` 方法、option 與 jQuery event 操作。
- `demo/js/demo.js`：Pure JS 與 jQuery Demo 共用的資料展示、工具列、Popup、篩選及匯出流程。

開發版入口為 `demo/dev-jquery-grid.html`；引用 build 輸出的 browser global 版本為 `demo/demo-jquery.html`。

## 主要能力

- 固定列高與欄寬的雙向 virtualization，適合大量資料。
- 左右凍結欄、列號欄、欄位顯示切換、footer aggregate 與 1 至 3 階群組。
- 本機資料或 `remote: true` 遠端分頁、排序與搜尋。
- 單一 cell 選取、多選列、鍵盤導覽、欄寬調整與欄位拖曳重排。
- `textbox`、`numberbox`、`datebox`、`combobox`、`color` editor，以及同步／非同步欄位驗證；`datebox` 在 mask 為 `9999/99` 或 `9999-99` 時使用年月 popup，`color` 可輸入 hex 或標準 CSS 顏色名稱，名稱提交後保留原文字。
- 欄位搜尋列會為 `datebox`、`combobox`、`color` 顯示對應下拉 panel；搜尋輸入僅建立 filter，不執行 cell validation。
- CSV 與 XLSX 匯出；Excel 支援凍結窗格、篩選、群組、footer、格式與隱藏欄。
- `en`、`zh-TW`、`zh-CN` locale 檔案與多組內建主題。

## 套件與原始碼結構

`fabui` 是最上層 namespace，目前只公開 `fabui.FabGrid` 與其必要的 `fabui.editorDefinitions`、`fabui.FabGridLocales`。其他表單控件保留在原始碼中，尚未列入發佈 bundle，規劃請見 [TODO](./TODO.md)。

可透過 `fabui.version` 取得發佈日期版本，格式為 `YYYY.M.D`，例如 `2026.7.11`。每次執行 build 時會依本機當天日期自動產生。

```text
src/fabui.js             公開入口
src/grid/fabgrid.js      FabGrid 核心
src/editor/              共用 editor 定義
```

發佈檔位於 `dist/`：`fabui.js`、`fabui.min.js`、`fabui.esm.js`、`fabui.esm.min.js`、`fabui.css` 與主題 CSS。

## 本機開發

```bash
npm run serve
```

開啟 `http://127.0.0.1:4173/demo/` 查看 demo。若需要重新產生發佈檔，請執行：

```bash
npm run build
```

## 專案方向

FabGrid 保持核心 pure JavaScript 與效能優先；現有 Vue 2 與 jQuery wrapper 僅負責 options、events、methods 與 lifecycle 對應，不接管 cell rendering。
