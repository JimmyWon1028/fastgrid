# FabGrid TODO

## FabUI PivotGrid

- [x] 由 `fabui.pivot` 公開 `PivotEngine`、`PivotField`、`PivotPanel`、`PivotGrid`、`PivotChart`、`PivotWorkspace`、`PivotAggregate` 與 `PivotShowTotals`。
- [x] PivotPanel Fields／Filters／Rows／Columns／Values、拖放、排序、單值 filter、aggregate 與 viewDefinition 儲存還原。
- [x] 本機 Array row／column／value／filter fields 與 Sum、Count、Average、Min、Max。
- [x] 多層欄標頭、固定 row fields、小計／總計、前後位置、列／欄展開收合。
- [x] Dimension 排序、Pivot 右鍵選單、雙擊原始明細與 viewDefinition。
- [x] 沿用 FabGrid virtualization、selection、clipboard、export、locale 與 theme variables。
- [x] `demo/dev-pivot.html` source-mode 與 `demo/pivot.html` build-mode Demo。
- [x] `PivotWorkspace` 三合一組合、自適應三欄／三列、可拖曳 Splitter，以及 `demo/dev-pivot-workspace.html`／`demo/pivot-workspace.html`。
- [x] 非同步分批彙總、進度回報與取消中的工作。
- [x] PivotPanel 進階多值 filter dialog、非同步 `deferUpdate()`、touch drag、PivotSlicer、calculated fields、weighted aggregate 與 ShowAs。
- [x] Vue 2／jQuery Pivot wrapper。

Server-side Pivot／OLAP／SSAS 不列入目前產品範圍。

## 遠端資料模式

- [x] 完成 `remote: true` 的分頁、排序與篩選基礎協定。
  - [x] 定義模擬遠端資料來源 `loader(params)` 介面。
  - [x] 支援 `{ page, rows }` 分頁請求與 `{ total, rows }` 回應。
  - [x] 定義載入中、錯誤與過期請求忽略機制。
  - [x] 定義 EasyUI `sort`、`order` 遠端排序請求格式。
  - [x] 定義遠端全域搜尋 `q` 與欄位篩選 `filterRules` 請求格式。
  - 維持 virtualization，不一次建立完整 cell matrix。

目前 `remote` 預設為 `false`。設定為 `true` 已支援 GET／POST、Promise loader、遠端分頁、排序、全域搜尋與欄位篩選。

## FabGrid 模組拆分

拆分原則：FabGrid 專用程式統一放在 `src/grid/`，以完整責任領域整併，不再建立過多小型 feature 檔案；公開 API 與既有行為必須保持相容。

已完成：

- [x] `src/grid/fabgrid-export.js`
  - CSV、Excel 公開 API 與下載流程。
  - XLSX package、workbook、worksheet、relationships 與 document properties。
  - group／footer row、frozen pane、column width 與 computed CSS style resolver。
  - style registry、font、fill、border、number format 與 cell XML。
  - ZIP、UTF-8 byte 與 CRC32 writer。
- [x] `src/grid/fabgrid-data.js`
  - binding、typed comparison、pagination、remote request／response。
  - itemsSource、observed source、remote load/reload 與 pager options。
  - filter、global／column search、sorting 與 `applyView()`。
  - grouping prototype 流程、group state、group row 與 aggregate 協調。
- [x] `src/grid/fabgrid-tree.js`
  - `childItemsPath` 階層資料讀取、可視樹列扁平化與循環資料保護。
  - 節點收合狀態、同層排序、篩選祖先路徑、階層鍵盤導覽與 TreeGrid API。
- [x] `src/grid/fabgrid-editor.js`
  - mask、caret、copy 與 validation result helper。
- [x] `src/grid/fabgrid-editor-runtime.js`
  - editor lifecycle、text／number、date／年月模式、combo 與 color。
  - 同步／非同步 validation、invalid item 狀態與 popup rendering／定位。
- [x] `src/grid/fabgrid-filter-ui.js`
  - Search Row、Excel-like filter、欄位選擇器與 Grid popup UI。
- [x] `src/grid/fabgrid-selection.js`
  - selection、鍵盤導覽、clipboard、欄位拖曳與欄寬調整。
- [x] `src/grid/fabgrid-drag.js`
  - 本機資料列拖曳、跨 Grid drop 與 TreeGrid drop 協調。
- [x] `src/grid/fabgrid-view.js`
  - layout、scrollbar、雙向 virtualization 與 rendering。
- [x] `src/grid/fabgrid-types.js`
  - Row、GroupRow、CellRange 與 panel 相容類型。
- [x] Grid 專用版面樣式移至 `src/grid/fabgrid.css`。
- [x] 共用 icon 樣式更名為 `src/fabui.icon.css`，保留在 `src/`。

`src/grid/fabgrid.js` 保留 factory、公共 API、事件、DOM lifecycle 與各領域 installer 協調。後續只有在出現新的完整責任領域、能維持清楚邊界且不增加循環依賴時才繼續拆分，不以檔案大小本身作為拆分依據。

每批 source 修改後先執行 `npm test` 與 JavaScript 語法檢查；需要完整 bundle 驗證時使用 `/tmp` 隔離副本 smoke。未明確要求 build 時不得改寫工作區 `dist`。

## FabUI Chart

- [x] 主 bundle 公開 `fabui.Chart`。
- [x] 支援直條圖、橫條圖、折線圖與圓餅圖。
- [x] SVG rendering、tooltip、legend、ResizeObserver、資料更新與 dispose。
- [x] 英文、繁中、簡中基本文字。
- [x] 四種圖表 Demo、API 文件、單元測試與 browser smoke。

## 後續 FabUI 元件

以下元件已列入 FabUI roadmap；已完成項目會由主 bundle 公開，未完成項目仍不納入 `dist/fabui.*`：

- [x] `fabui.EditBox`
  - 以單一 `fabui.EditBox` 整合 text、number、date、combo、color，原四個 Box class 僅保留為內部實作。
  - 共用視覺樣式以 TextBox 為基準，提供共用 value、state、event methods 與必要的日期／清單 methods。
  - FabGrid 與 `fabui.EditBox` 共用 `src/editbox/editbox-definitions.js`，不再維護重複 editor 定義。
  - 納入 FabUI core 的 browser global／ES module build 與 CSS，使用方式為 `new fabui.EditBox(...)`。
  - 不產生獨立 EditBox bundle；另提供 `$.fn.fabeditbox` jQuery wrapper、types、API、測試與 Demo。
- [x] `fabui.Button`
  - 樣式、options、methods 與 click 行為參考 [jQuery EasyUI LinkButton／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=LinkButton&theme=default&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 支援 `<a>`／`<button>`、動態與百分比尺寸、disabled、plain、outline、toggle、selected、group、預設左側及四方向 `iconCls`、small／large、theme、Control registry 與 dispose 還原。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。
- [x] `fabui.Calendar`
  - Options、methods 與 events 參考 [jQuery EasyUI Calendar／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Calendar&theme=default&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 支援年月導覽、月份選單、週次、`formatter`、`styler`、`validator`、三語系、16 組 theme、鍵盤、Control registry 與 dispose 還原；農民曆 `showLunar` 預設為 `false`。
  - 與 Date EditBox／FabGrid 日期 editor 共用同一個 DatePopup renderer 與 `.fui-calendar-*` 樣式，納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API 與單元測試。
- [x] `fabui.Tabs`
  - Options、methods 與 events 參考 [jQuery EasyUI Tabs／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Tabs&theme=default&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 支援 markup／programmatic tabs、動態新增／插入／更新／關閉、tab tools、header tools、四方向排列、overflow scroller、遠端內容、disabled、keyboard、三語系、16 組 theme、Control registry 與 dispose 還原；拖曳中的 Tab 使用 50% 透明度，插入線固定在目標 Tab 右側並使用 theme 主色補色。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser smoke。
- [x] `fabui.Tree`
  - Options、methods 與 events 參考 [jQuery EasyUI Tree／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Tree&theme=default&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 支援 nested markup／data、展開收合、checkbox cascade、lines、`iconCls`、動態節點 API、右鍵事件、拖放、inline edit、filter、Promise／callback lazy loader、鍵盤、ARIA、三語系、16 組 theme、Control registry 與 dispose 還原。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser smoke。
- [x] `fabui.Tooltip`
  - Options、methods 與 events 參考 [jQuery EasyUI Tooltip／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Tooltip&theme=default&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 支援四方向定位、HTML／function content、滑鼠追蹤、顯示／隱藏延遲、viewport 翻轉、Escape、外部點擊、16 組 theme、Control registry 與 dispose 還原。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser smoke。
- [x] `fabui.Menu`
  - Options、methods 與 events 參考 [jQuery EasyUI Menu／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Menu&theme=default&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 支援 context／inline menu、巢狀 submenu、自訂內容、icon、separator、disabled、runtime item API、三語系 ARIA、鍵盤、viewport 翻轉、Escape、外部點擊、16 組 theme、Control registry 與 dispose 還原。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。
- [x] `fabui.MenuButton`
  - Options、methods 與互動參考 [jQuery EasyUI MenuButton／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=MenuButton&theme=default&dir=ltr&pitem=&sort=asc)。
  - 直接組合 `fabui.Button` 與 `fabui.Menu`，支援 hover／click、左右對齊、下拉箭頭、disabled、鍵盤、ARIA、theme、Control registry 與 dispose，不重複實作 popup lifecycle。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。
- [x] `fabui.SplitButton`
  - Options、methods 與互動參考 [jQuery EasyUI SplitButton／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=SplitButton&theme=default&dir=ltr&pitem=&sort=asc)。
  - 直接組合 `fabui.MenuButton`，主區域執行主動作，右側箭頭區 click／hover 才顯示 Menu，支援 disabled、鍵盤、ARIA、theme、Control registry 與 dispose。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。
- [x] `fabui.Messager`
  - API、非同步 callback 與 Default 視覺參考 [jQuery EasyUI Messager／Default Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Messager&theme=default&dir=ltr&pitem=&sort=asc)。
  - Singleton API 支援 `show`、`alert`、`confirm`、`prompt`、`progress`、三語系、16 組 theme、鍵盤、ARIA、Toast 堆疊與 lifecycle；Dialog 必須共用 `fabui.Window`，動作必須共用 `fabui.Button`。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。
- [x] `fabui.Window`
  - 樣式、options、methods 與 events 定義參考 [jQuery EasyUI Window／Material Teal Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Window&theme=material-teal&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 實作拖曳、八方向縮放、modal mask、置中、收合、最小化、最大化／還原、theme、locale、Control registry 與 lifecycle events。
  - 預設工具為最大化／還原與關閉；收合、最小化可選擇啟用，各狀態切換提供過渡動畫，左上角標題 icon 統一使用 `iconCls: 'icon-xxx'`。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。
- [x] `fabui.Panel`
  - 樣式、options、methods 與 events 定義參考 [jQuery EasyUI Panel／Material Teal Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Panel&theme=material-teal&dir=ltr&pitem=&sort=asc)。
  - Pure JavaScript 實作 header／body／footer、custom tools、收合、最小化、最大化／還原、關閉、fit、垂直標題、遠端 lazy load、cache、theme、locale、Control registry 與可取消 lifecycle。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。
- [x] `fabui.Layout`
  - 樣式、options、methods、events 與 north／south／east／west／center 區域定義參考 [jQuery EasyUI Layout／Material Teal Demo](https://www.jeasyui.com/demo/main/index.php?plugin=Layout&theme=material-teal&dir=ltr&pitem=&sort=asc)。
  - 五區都重用 `fabui.Panel`，Layout 只維護 dock geometry、collapsed bar、float／dock expand、pointer／keyboard Splitter、動態 add／remove、split／unsplit、巢狀 resize 與 lifecycle；edge region 收起／展開同步動畫 center、Splitter 與 collapsed bar。
  - 納入 FabUI core browser global／ES module／CSS，提供 source-mode／build-mode Demo、API、單元測試與 browser validation。

以上元件實作時仍須維持 pure JavaScript 核心；EasyUI 僅作為視覺與 API 契約參考，不加入 jQuery／EasyUI runtime 依賴。是否納入 FabUI core bundle 依各元件的產品契約決定。

TextBox、NumberBox、DateBox、ComboBox 原始碼只作為 `fabui.EditBox` 內部實作，不再各自作為公開 standalone class。
