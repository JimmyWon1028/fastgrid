# FabGrid 專案筆記

## 語言與風格

- 回覆使用者時一律使用繁體中文。
- 代碼註釋必須使用英文。
- 代碼縮排一律使用兩個空白，不使用 tab。

## Git 與 GitHub 工作規則

- 可以依任務需要建立本地 commit，但不要主動推送到 GitHub。
- 只有在使用者明確要求「上傳」、「推送」、「同步到 GitHub」或同等意思時，才執行 `git push` 或 GitHub 遠端操作。

## 開發工作流程

- 修改範圍、需求意圖或既有行為是否應保留，只要有任何不確定，必須先向使用者確認清楚再修改；不得自行擴大需求、移除未被要求移除的功能或改變未被要求改變的行為。
- `resource/` 位於專案根目錄，只存放本機參考檔案；build、Demo 與正式 source 不得依賴，Git/GitHub 必須忽略。
- 日常修改不要每次都編譯到 `dist`。
- 除非使用者明確要求「編譯」、「build」、「重建 dist」、「產生 dist」或同等意思，否則不要主動執行會更新 `dist` 的指令，例如 `npm run build` 或 `npm run smoke`。
- 修改確認完成後，預設啟動開發伺服器，提供本機網址讓使用者自行測試。
- 若任務需要驗證但使用者沒有要求編譯，優先使用不會改寫 `dist` 的檢查方式；如果現有驗證只能透過 build/smoke 完成，先回報限制並等待使用者指示。
- FabUI 使用的 icon 定義統一放在 `src/fabui.icon.css`，例如 `icon-datebox`、`icon-refwin`；不要在核心 CSS 直接硬編圖檔路徑。
- 開發測試優先使用 source-mode demo，例如 `demo/dev.html` 直接引用公開入口 `src/fabui.js` 與 `src/fabui.css`；內部模組仍放在各自目錄。修改 source 後要同步更新 query version，避免瀏覽器快取造成誤判。
- 新增任何核心 UI 文字時，必須同步補齊 `en`、`zh-TW`、`zh-CN` locale key；demo-only 文字若會隨語言切換，也要放進 demo locale pack，不要寫死單一語言。
- popup menu 樣式要維持一致：左側 icon 欄、icon 後分隔線、緊湊列高與清楚 hover/active 狀態；後續新增 popup menu 時沿用目前 filter menu 的視覺規則。
- 工作進度記錄放在 `worklogs/YYYY-MM-DD.md`，固定使用 `## 完成進度` 標題；功能契約改動時，同步更新 README 與本文件。
- Excel 預設匯出完整欄位集合，隱藏欄位必須保留資料並在工作表標記為 hidden；只有明確傳入 `visibleOnly === true` 時才只匯出可見欄位。
- Excel 匯出使用目前 grid `view`。群組啟用時必須保留 group row、群組 aggregate 顯示格式與收合狀態。

## 產品方向

FabGrid 是一個以效能為優先的 data grid，核心使用 pure JavaScript 建置。

目標不是複製 Wijmo FlexGrid 的所有功能。第一版應該先提供一般資料表常見且實用的能力，同時保持渲染引擎快速、簡單、可擴充。

優先順序：

1. 效能。
2. 穩定的核心 API。
3. 基本 grid 功能。
4. 額外功能與 Vue wrapper。

## 技術方向

- `fabui` 是最上層 UI namespace，Browser global 與 ES module 公開入口目前輸出 FabGrid、Chart 與其必要定義。
- Browser global 與 ES module 皆以 `fabui.version` 公開 `YYYY.M.D` 格式的發佈日期版本，每次 build 依本機當天日期自動產生。
- FabGrid editor 的共用定義位於 `src/editor/editor-definitions.js`，由 `fabui.editorDefinitions` 公開；不可在 Grid 內維護多套數字／日期清理、格式化或 editor class。
- FabGrid 年月編輯統一使用 `datebox`；當 mask 為 `9999/99` 或 `9999-99` 時，popup 固定使用年份／月份選擇模式，不再定義 FabGrid `yymmbox` editor。
- FabGrid 位於 `fabui.FabGrid`；`src/fabui.js` 是入口，`src/grid/fabgrid.js` 是 Grid 子模組。
- Chart 位於 `fabui.Chart`；使用 pure JavaScript SVG rendering，只支援直條圖、橫條圖、折線圖與圓餅圖，原始碼位於 `src/chart/` 並納入主 bundle。
- TextBox、NumberBox、DateBox、YymmBox、ComboBox、Tabs 目前只保留原始碼，全部列於 `TODO.md`；不得由 `src/fabui.js`、`src/fabui.css`、`build/build.cjs` 或 `dist/fabui.*` 公開或編譯。
- 未來若要重新發佈任何 standalone 控件，必須建立獨立 entry、CSS、demo、API 文件與驗證；不得併回 FabGrid core bundle。
- 核心使用不綁定框架的 pure JavaScript。
- 第一版 demo 不需要後端。
- core package 不依賴 Vue。
- 資料來源選項 `remote` 預設為 `false`；`remote: true` 已支援 GET／POST、Promise loader、遠端分頁、排序、全域搜尋與欄位篩選。
- core 必須能打包成可在其他專案引用的 library 檔案。
- 發佈主檔固定為 `fabui.js`、`fabui.min.js`、`fabui.esm.js`、`fabui.esm.min.js`、`fabui.css`、`fabui.min.css`，並輸出 `dist/theme` 下的 theme CSS 與圖片依賴。
- `dist/fabui.min.js` 必須是可用 `<script>` 直接引用的 browser global 壓縮版本。
- core 穩定之後，可以再加入 Vue wrapper。
- Vue wrapper 只負責把 props、events、lifecycle 對應到 pure JS core。
- 在大資料量情境下，Vue 不應該接管每個 cell 的渲染。

建議套件方向：

```txt
fabgrid-core
fabgrid-vue
```

## 現行已交付能力

以下是目前 source 與 smoke test 已涵蓋的現行功能契約，優先於後方保留的歷史 V1 規劃：

- 雙向 virtualization、左右凍結欄、固定列高與欄寬。
- 本機與 `remote: true` 資料模式，包含分頁、排序、全域搜尋與欄位篩選。
- 1 至 3 階列群組、aggregate、群組收合狀態與 Excel 群組匯出。
- 單一 cell、列選取、多選列、clipboard copy 與鍵盤導覽。
- 欄位拖曳、欄寬調整、欄位顯示切換、footer aggregate。
- CSV 與 Excel 匯出，以及 Excel hidden columns、格式、凍結窗格與 autoFilter。
- `textbox`、`numberbox`、`datebox`、`combobox` grid editor；standalone 控件仍不由 core bundle 公開。
- `en`、`zh-TW`、`zh-CN` locale 與多組 theme。

後方 V1 章節是初始範圍與架構背景，不得用來否定上述已交付能力。新增或修改功能時，以目前 source、API 文件與 smoke test 契約為準。

## Chart 開發規則與經驗

- Chart 公開類別固定為 `fabui.Chart`，原始碼位於 `src/chart/chart.js` 與 `src/chart/chart.css`，並納入 FabUI 主 bundle；不要把核心 Chart 行為只寫在 Demo。
- Chart 範圍只包含 `Column`、`Bar`、`Line`、`Pie`。資料 API 採 Wijmo FlexChart／FlexPie 常見模式：Cartesian 使用 `itemsSource`、`bindingX`、`series[].binding`；Pie 使用 `itemsSource`、`bindingName`、`binding`。
- 保留舊版 `type`、`title`、`categories`、`colors`、`series[].data` 相容層；新增功能不可無故破壞既有 Chart 呼叫方式。
- Grid 與 Chart 可以共用同一個 `itemsSource` 陣列參照。Chart 預設以 `observeData: true` 偵測綁定欄位變動並自動 refresh；不要在 Demo 維護第二份同步資料。
- Grid／Chart selection 連動使用 Chart 的可選 `selectionSource`。預設必須為 `null`，未傳入時 Chart 可完全獨立運作；傳入 FabGrid instance 後由 Chart 綁定 `selectionChanged`、反向呼叫 Grid `select()`，並在更換來源或 `dispose()` 時解除 listener。
- 不要把 Chart instance 寫死在 FabGrid 核心，也不要要求 Demo 手動維護 `grid.selectionChanged -> chart.selectPoint()`；跨元件協調由 Chart 的 `selectionSource` 管理，Grid 不依賴 Chart。
- `selectPoint()` 若收到相同 point，不得重複 refresh。Pie 點擊會先選取 Chart 再反向選取 Grid；重複重繪會立即取代正在旋轉的 SVG，造成動畫中斷。
- Pie selection 使用 `selectedItemPosition`、`selectedItemOffset`、`isAnimated`。旋轉必須從目前角度沿最短路徑平滑移動到目標位置；selected slice 依半徑比例向外位移。
- Pie selection 動畫只做整體旋轉與 selected slice 位移。不可加入 fade in／fade out，旋轉期間所有 slices 必須保持可見，避免消失後再出現。
- Pie 初始化未選取時必須明確處理 `selection == null`，不可把 `null` 當成 index 0；否則角度計算會產生 `NaN` SVG path，導致 Pie 初始化不可見。
- Pie `dataLabel` 支援 `{name}`、`{value}`、`{percent}` 模板或 `content(data)` function，位置支援 `Inside`／`Outside`；未設定時不顯示。
- Chart 預設 palette 使用柔和 RGBA 半透明色，alpha 為 `.72`；明確傳入 `palette` 或 `colors` 時原樣使用自訂色彩。
- selected row 對應的 Column、Bar、Pie mark 使用 1px dashed 描邊；Line Chart selected point 使用 1px solid，折線本身維持實線。
- 動畫、selection、dataLabel、palette 與資料監測都必須實作在 Chart 元件；Demo 只負責建立資料與傳入 options。
- `demo/grid-chart.html` 是 source-mode 開發版，引用 `src/fabui.js`；`demo/grid-chart.es5.html` 是 build-mode ES5 語法範例，只引用 `dist/fabui.min.js` 與 `dist/fabui.css`。兩版都要保留並維持 2 x 2 Grid／Column-Bar／Line／Pie 範例。
- 日常 source 修改不要主動 build。只有使用者明確要求 build 時才更新 `dist`；build 後需確認六個主檔存在，ES5 Build Demo 必須可由 browser global 建立 Grid 與 Chart。
- Chart 修改至少執行 `node --check src/chart/chart.js` 與 `npm test`；涉及 SVG 顯示、動畫、selection 或 CSS 時，應再用瀏覽器檢查實際 path、computed style 與互動狀態。

建議輸出檔案：

```txt
dist/
  fabui.esm.js
  fabui.esm.min.js
  fabui.js
  fabui.min.js
  fabui.css
  fabui.min.css
  theme/
```

`fabui.min.js` 是 browser global build，能在其他專案中直接引用：

```html
<link rel="stylesheet" href="./fabui.css">
<script src="./fabui.min.js"></script>
<script>
  const grid = new fabui.FabGrid('#grid', {
    itemsSource: rows,
    columns
  });
</script>
```

Source code 使用 ES module 維護，並從 `src/fabui.js` 組合 namespace：

```js
import fabui from './src/fabui.js';

const grid = new fabui.FabGrid('#grid', {
  rowHeight: 32,
  headerHeight: 36,
  overscanRows: 8,
  overscanColumns: 3,
  frozenColumns: 0,
  itemsSource: rows,
  columns,
  allowSorting: true,
  allowEditing: true,
  allowResizing: true
});
```

## 效能要求

FabGrid 從一開始就必須以雙向 virtualization 為核心設計。

- 縱向捲動只渲染可視 rows 加上 buffer rows。
- 橫向捲動只渲染可視 columns 加上 buffer columns。
- 不渲染完整的 cell matrix。
- 不為每個 row-column 組合建立邏輯 cell object。
- cell value 應該依據 row item 與 column binding 即時計算。
- header、body，以及未來可能加入的 footer，必須共用同一套橫向 virtual range。
- 若設定 `frozenColumns`，左側 frozen pane 只渲染凍結 columns，可捲動區域仍維持橫向 virtualization。
- `frozenColumns` 不應造成所有 columns 都被渲染。
- 捲動相關工作應該透過 `requestAnimationFrame` 排程。
- 使用事件委派，避免替大量 cell 個別綁定 listener。
- 避免在 scroll path 中造成 layout thrashing。
- 預設 cell 渲染使用 `textContent`。
- rich HTML 或框架 template 必須是 opt-in，而且使用範圍應受限制。

初始 demo 目標：

```txt
2000 rows x 20 columns
```

未來壓力測試目標：

```txt
20000 rows x 50 columns
```

架構應該能夠朝壓力測試目標擴充，而不需要重寫。

## 歷史 V1 Demo 範圍

第一版 demo 只做純前端。

- 不需要後端。
- 不需要 server-side data source。
- 在前端本地產生 mock data。
- 使用 2000 rows x 20 columns。
- 使用 pure JS、CSS、HTML。
- Demo 應該引用打包後的 `dist/fabui.min.js` 與 `dist/fabui.css`，用來驗證其他專案的引用方式。
- 除非有很強的理由，否則避免第三方依賴。

Demo 應該顯示有助於觀察效能的 runtime stats：

- 總 rows 數。
- 目前可視 row range。
- 目前可視 column range。
- 已渲染 cell 數。

## 歷史 V1 核心功能

優先實作以下功能：

1. 資料顯示
   - `itemsSource` 綁定 array。
   - `columns` 明確定義 grid columns。
   - 支援 `binding`、`header`、`width`、`minWidth`、`align`、`dataType`。

2. 雙向 virtualization
   - 預設使用固定 `rowHeight`。
   - 可設定 `overscanRows`。
   - 可設定 `overscanColumns`。
   - 可設定 `frozenColumns`，用來指定左側凍結 columns 數量。
   - 維護 column width offsets，用於橫向 virtualization。
   - 橫向 range 計算使用 binary search 或同等效率的查找方式。
   - 橫向 virtualization 只套用在非凍結 columns 的 scrollable pane。

3. Header
   - Sticky header。
   - Header 與 body 橫向捲動同步。
   - Frozen header cells 與 frozen body cells 必須對齊。
   - 顯示排序狀態。
   - 顯示 resize handle。

4. Frozen columns
   - 支援 `frozenColumns` number option。
   - 預設值為 `0`。
   - 凍結 columns 固定在左側，不受橫向捲動影響。
   - 凍結 columns 仍需跟隨縱向 virtualization。
   - 凍結區與可捲動區應共用同一套 row range。
   - `frozenColumns` 不可大於 visible columns 總數，超過時應 clamp。

5. 排序
   - 點擊 header 可對單一 column 排序。
   - 排序狀態包含 ascending、descending、none。
   - 支援 string、number、date、boolean 的基本比較。
   - 提供類似 `sortingColumn`、`sortedColumn` 的事件。

6. 篩選
   - 第一版先做簡單全域搜尋。
   - 支援 `setFilter(predicate)` 與 `clearFilter()` 這類 API hook。
   - V1 不做 Excel-style filter menu。

7. Column resizing
   - 拖曳 header 邊緣調整欄寬。
   - 遵守 `minWidth`。
   - resize 後重建 column offset cache。
   - 若 resize 的 column 位於 frozen pane，需要同步更新 frozen pane width。

8. 選取
   - 單一 cell selection。
   - 點擊 cell 進行選取。
   - 支援方向鍵導覽。
   - 可將選取 cell 捲動到可視區。
   - `Page Up`／`Page Down` 依 Excel 行為移動一個可視頁面，保持同一欄並 clamp 到資料首尾。
   - 同欄跳到資料首尾：Windows／Linux 使用 `Ctrl + ArrowUp/ArrowDown`；macOS 使用 `Fn + Option + ArrowUp/ArrowDown`，DOM key 對應 `Option + PageUp/PageDown`。
   - 同列跳到左右邊界：Windows／Linux 使用 `Ctrl + ArrowLeft/ArrowRight`；macOS 使用 `Fn + Option + ArrowLeft/ArrowRight`，DOM key 對應 `Option + Home/End`；不可使用會觸發瀏覽器上一頁／下一頁的單純 `Option + ArrowLeft/ArrowRight`。
   - macOS 另支援 `Fn + ArrowLeft/ArrowRight`，DOM key 對應無 modifier 的 `Home/End`；輸入框與 cell editor 編輯狀態不得攔截。
   - V1 不做 range selection 或 multi-selection。

9. 編輯
   - Double click、Enter 或 F2 開始編輯。
   - Enter 提交。
   - Escape 取消。
   - 先從文字輸入開始。
   - number 與 boolean 使用簡單 parser。
   - 提供類似 `cellEditStarting`、`cellEditEnded` 的事件。

10. 格式化
   - 支援 column-level formatter function。
   - 支援 grid-level `formatCell` callback。
   - 預設渲染必須保持輕量。

11. 資料更新 API
   - `setItemsSource(rows)`
   - `setColumns(columns)`
   - `setFrozenColumns(count)`
   - `refresh()`
   - `invalidate()`
   - `getCellData(row, col)`
   - `setCellData(row, col, value)`
   - `dispose()`

12. CSV / Excel 匯出
   - 匯出目前 view。
   - 支援只匯出可見 columns。
   - Excel 支援欄寬、左側 frozen pane、autoFilter、footer、number format、grid style 與 hidden columns。
   - Excel 匯出群組時保留 group row 與 aggregate 顯示格式。

13. Pagination
   - `pagination` 預設為 `false`。
   - 本地資料模式支援 `pageNumber`、`pageSize` 與 `pageList`。
   - `showPageList` 預設為 `false`；pageList 隱藏時，其右側分隔線也必須隱藏。
   - DOM 使用 `.fg-pager > .fg-pagination`，`getPager()` 回傳外層 pager。
   - Pagination 設定優先放在 `pager` 物件內；既有頂層 `pageNumber`、`pageSize`、`pageList`、`showPageList`、`showPageInfo`、`showRefresh` 保留相容性。
   - `pager.showPageInfo` 預設為 `true`；設為 `false` 時不顯示右側資料範圍與總筆數訊息。
   - `pager.showRefresh` 預設為 `true`；設為 `false` 時不顯示重新整理按鈕及其左側分隔線。
   - UI 參考 EasyUI DataGrid pager：每頁筆數、首頁、上一頁、頁碼、下一頁、末頁、重新整理與筆數資訊。
   - `remote: true` 支援 `url + method` 內建請求與自訂 Promise loader；method 限定為 GET 或 POST。
   - 遠端排序使用 EasyUI 的 `sort`、`order` 參數，排序後回到第 1 頁；多欄排序值以逗號分隔。
   - 遠端全域搜尋使用 `q`，欄位篩選使用 JSON `filterRules`；條件改變後回到第 1 頁。
   - 函式型 `setFilter(predicate)` 無法序列化，僅限 `remote: false`。

## 歷史 V1 當時不做的功能

本節保留初始決策背景，其中 remote data、pagination、grouping、clipboard 等項目後來已交付；現況以「現行已交付能力」、README、API 文件與測試為準。

在 core 經過驗證之前，先避免以下功能：

- Tree grid。
- Merged cells。
- Frozen rows。
- Range selection。
- Clipboard copy/paste。
- Excel-style filter menu。
- Column pinning。
- Row details。
- Custom Vue slot cells。
- Variable row height。
- Auto row height。
- Server-side data source。

## 內部架構

目前已建立並由 `src/grid/fabgrid.js` 使用的 Grid 專用模組邊界：

```txt
src/grid/fabgrid-data.js    binding、資料比較、remote、pagination、grouping、aggregate
src/grid/fabgrid-editor.js  grid editor mask、caret 與 validation helpers
src/grid/fabgrid-export.js  CSV、XML 與 Excel 共用序列化工具
src/grid/fabgrid.css        FabGrid 核心樣式
src/fabui.icon.css          FabUI icon 樣式入口
```

FabGrid 專用程式統一放在 `src/grid/`；只有確認可由其他 FabUI 元件共用的定義才放在 Grid 目錄外。`src/grid/fabgrid.js` 保留 FabGrid lifecycle、DOM、事件與流程協調，且不得改變公開 API。

建議模組邊界：

```txt
src/
  fabui.js
  grid/
    fabgrid.js
  core/
    FabGrid.js
    Column.js
    EventEmitter.js
  data/
    DataView.js
  layout/
    LayoutEngine.js
    RowVirtualizer.js
    ColumnVirtualizer.js
  render/
    GridRenderer.js
    HeaderRenderer.js
    BodyRenderer.js
    CellRecycler.js
  features/
    Selection.js
    Editing.js
    Sorting.js
    Filtering.js
    Resizing.js
    ExportCsv.js
  grid/
    fabgrid.css
  fabui.icon.css
  fabui.css
  theme/
    fabgrid.<suffix>.css
    images/
    <suffix>/
      images/
```

建議打包相關檔案：

```txt
package.json
build/
  build.js
dist/
  fabui.esm.js
  fabui.esm.min.js
  fabui.js
  fabui.min.js
  fabui.css
  fabui.min.css
```

打包需求：

- Source code 使用 ES6 modules 維護。
- `dist/fabui.esm.js` 提供 ES module 可讀版本。
- `dist/fabui.esm.min.js` 提供 ES module 壓縮版本。
- `dist/fabui.js` 提供 browser global 可讀版本。
- `dist/fabui.min.js` 提供 browser global 壓縮版本。
- `dist/fabui.css` 整合所有核心控件、icon 與主題，圖片路徑指向 `dist/theme`。
- `dist/fabui.min.css` 提供整合 CSS 壓縮版本。
- Browser global namespace 使用 `fabui.FabGrid`。
- Browser global namespace 使用 `fabui`，FabGrid 由 `fabui.FabGrid` 取得。
- 每次 build 必須先清理 `dist`，主檔之外只保留必要的 `theme` CSS 與圖片依賴。
- 不要把 demo-only code 打包進 library。
- Build script 必須可重複執行。

重要設計規則：

```txt
DataView 負責轉換資料。
Virtualizers 負責計算可視範圍。
Renderers 只負責繪製目前 viewport。
Features 負責協調使用者互動。
```

不要把 sorting、filtering 或 grouping 邏輯放進 renderer。

## DOM 策略

主要 body 避免使用原生完整 table。為了 virtualization，優先使用 div-based grid layout。

建議結構：

```txt
.fg-root
  .fg-header
    .fg-header-frozen
    .fg-header-scroll
      .fg-header-canvas
  .fg-body-scroll
    .fg-size-layer
    .fg-frozen-layer
    .fg-cell-layer
```

命名慣例：

```txt
.fg-root
.fg-header
.fg-body
.fg-row
.fg-cell
```

Size layer 負責建立 scrollbar 尺寸：

```txt
width = totalColumnWidth
height = totalRowCount * rowHeight
```

Cell layer 只渲染可視 cells，並使用 transform 或 absolute positioning 定位。

若設定 `frozenColumns`，DOM 需要拆成兩個水平區域：

```txt
frozen pane: 渲染左側凍結 columns，不受 scrollLeft 影響。
scroll pane: 渲染剩餘 columns，依 scrollLeft 進行橫向 virtualization。
```

兩個 pane 必須共用同一個 vertical row range，避免縱向捲動時產生錯位。

## Vue Wrapper 筆記

Vue wrapper 應該在 pure JS core 穩定之後再加入。

預期使用方式：

```vue
<FabGrid
  :items-source="rows"
  :columns="columns"
  :allow-sorting="true"
  :allow-editing="true"
  @cell-edit-ended="handleEdit"
  @selection-changed="handleSelection"
/>
```

Wrapper 職責：

- mount 時建立 core grid。
- unmount 前 dispose core grid。
- watch props 並呼叫 core setters。
- 將 core events 轉成 Vue emits。
- 傳入大型 reactive arrays 到 core 前，先使用 `toRaw`。

V1 避免讓 Vue 負責渲染每個 cell。

## 驗收標準

V1 符合以下條件時可視為成功：

- 2000 x 20 demo 載入快速。
- 縱向捲動體感順暢。
- 橫向捲動體感順暢。
- 已渲染 cell 數受 viewport 大小限制，而不是隨 dataset size 增加。
- Sorting 與 filtering 後仍保留 virtualization。
- Editing 能正確把值寫回 source data。
- Column resizing 能正確更新 layout。
- `frozenColumns` 能固定左側指定數量 columns，且不破壞雙向 virtualization。
- `dist` 產生六個 FabUI 主檔與必要的 `theme` CSS／圖片依賴。
- 能用 `<script src="./fabui.min.js">` 建立 `fabui.FabGrid` 與其他 FabUI 控件。
- Demo 頁面使用打包後的 dist 檔案運作。
- `dispose()` 會移除 listeners，且不留下明顯的殘留行為。
