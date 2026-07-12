<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

# FabGrid

FabUI 提供 pure JavaScript FabGrid 與 SVG Chart。FabGrid 支援雙向 virtualization、凍結欄、排序、搜尋、編輯、群組、分頁與 CSV / Excel 匯出；Chart 支援直條圖、橫條圖、折線圖與圓餅圖。

## 文件與 Demo

- [API 操作手冊](./docs/api.md)：完整的建構選項、欄位設定、方法、事件、遠端資料協定與匯出說明。
- [Chart API](./docs/chart-api.md)
- [Chart Demo](./demo/chart.html)
- [FabGrid + Chart 開發版 Demo](./demo/grid-chart.html)：引用 `src` ES module。
- [FabGrid + Chart ES5 Build Demo](./demo/grid-chart.es5.html)：引用 build 後的 `dist/fabui.min.js` browser global。
- [線上 Demo](https://jimmywon1028.github.io/fabgrid/demo/)
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

ES module 使用者可由 `dist/fabui.esm.js` 匯入 `fabui`，再以 `new fabui.FabGrid(...)` 建立元件；完整範例與所有 API 請見 [API 操作手冊](./docs/api.md)。

## 主要能力

- 固定列高與欄寬的雙向 virtualization，適合大量資料。
- 左右凍結欄、列號欄、欄位顯示切換、footer aggregate 與 1 至 3 階群組。
- 本機資料或 `remote: true` 遠端分頁、排序與搜尋。
- 單一 cell 選取、多選列、鍵盤導覽、欄寬調整與欄位拖曳重排。
- `textbox`、`numberbox`、`datebox`、`combobox` editor，以及同步／非同步欄位驗證；`datebox` 在 mask 為 `9999/99` 或 `9999-99` 時使用年月 popup。
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

FabGrid 保持核心 pure JavaScript 與效能優先；未來的 Vue wrapper 僅負責 props、events 與 lifecycle 對應，不接管 cell rendering。
