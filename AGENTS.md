# FabGrid 專案筆記

## 語言與風格

- 回覆使用者時一律使用繁體中文。
- 代碼註釋必須使用英文。
- 代碼縮排一律使用兩個空白，不使用 tab。

## Git 與 GitHub 工作規則

- 可以依任務需要建立本地 commit，但不要主動推送到 GitHub。
- 只有在使用者明確要求「上傳」、「推送」、「同步到 GitHub」或同等意思時，才執行 `git push` 或 GitHub 遠端操作。
- 除非使用者明確要求建立或切換分支，否則不得自行建立分支或切換離開目前分支；`build`、`push`、發佈或一般開發要求都不代表授權建立新分支。

## 開發工作流程

- 修改範圍、需求意圖或既有行為是否應保留，只要有任何不確定，必須先向使用者確認清楚再修改；不得自行擴大需求、移除未被要求移除的功能或改變未被要求改變的行為。
- `res/` 位於專案根目錄，只存放本機參考檔案；build、Demo 與正式 source 不得依賴，Git/GitHub 必須忽略。
- 日常修改不要每次都編譯到 `dist`。
- 除非使用者明確要求「編譯」、「build」、「重建 dist」、「產生 dist」或同等意思，否則不要主動執行會更新 `dist` 的指令，例如 `npm run build` 或 `npm run smoke`。
- 修改確認完成後，預設啟動開發伺服器，提供本機網址讓使用者自行測試。
- 若任務需要驗證但使用者沒有要求編譯，優先使用不會改寫 `dist` 的檢查方式；如果現有驗證只能透過 build/smoke 完成，先回報限制並等待使用者指示。
- FabUI 使用的 icon 定義統一放在 `src/fabui.icon.css`，例如 `icon-datebox`、`icon-refwin`；不要在核心 CSS 直接硬編圖檔路徑。
- 開發測試優先使用 source-mode `demo/dev-grid.html`，直接引用公開入口 `src/fabui.js` 與 `src/fabui.css`；build-mode 主 Demo 固定為 `demo/grid.html`。內部模組仍放在各自目錄。修改 source 後要同步更新 query version，避免瀏覽器快取造成誤判。
- 新增任何核心 UI 文字時，必須同步補齊 `en`、`zh-TW`、`zh-CN` locale key；demo-only 文字若會隨語言切換，也要放進 demo locale pack，不要寫死單一語言。
- popup menu 樣式要維持一致：左側 icon 欄、icon 後分隔線、緊湊列高與清楚 hover/active 狀態；後續新增 popup menu 時沿用目前 filter menu 的視覺規則。
- 所有既有與未來新增的 popup 都必須支援按 `Escape` 與點擊 popup 外部關閉；點擊 popup 內部或其 trigger 不得誤關閉。關閉只負責收起 popup，不得隱含套用、清除或提交尚未確認的內容；同時開啟多個 popup 時，點進其中一個也必須關閉其餘 popup。
- 工作進度記錄放在 `worklogs/YYYY-MM-DD.md`，固定使用 `## 完成進度` 標題；功能契約改動時，同步更新 README 與本文件。
- Excel 預設匯出完整欄位集合，隱藏欄位必須保留資料並在工作表標記為 hidden；只有明確傳入 `visibleOnly === true` 時才只匯出可見欄位。
- Excel 匯出使用目前 grid `view`。群組啟用時必須保留 group row、群組 aggregate 顯示格式與收合狀態。
- Excel 匯出的標題列必須跟隨目前 `headerDisplayMode`；畫面顯示 binding 時匯出 binding，顯示 header 時匯出 header。

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
- FabGrid 與 EditBox 共用的 editor 定義位於 `src/editbox/editbox-definitions.js`，由 core bundle 的 `fabui.editorDefinitions` 與獨立 EditBox 的 `EditBox.editorDefinitions` 公開；不可在 Grid 內維護多套數字／日期清理、格式化或 editor class。`src/editor/editor-definitions.js` 只保留舊 import path 相容入口。
- FabGrid 年月編輯統一使用 `datebox`；當 mask 為 `9999/99` 或 `9999-99` 時，popup 固定使用年份／月份選擇模式，不另外定義年月專用 editor。FabGrid 與獨立 EditBox 的 DateBox `autoUnmask` 預設皆為 `true`，複製日期／年月內容時必須移除遮罩字面值；只有明確設定 `autoUnmask: false` 時才保留遮罩。
- FabGrid 位於 `fabui.FabGrid`；`src/fabui.js` 是入口，`src/grid/fabgrid.js` 是 Grid 子模組。
- Chart 位於 `fabui.Chart`；使用 pure JavaScript SVG rendering，只支援直條圖、橫條圖、折線圖與圓餅圖，原始碼位於 `src/chart/` 並納入主 bundle。
- PivotChart 位於 `fabui.pivot.PivotChart`；直接監聽共用 PivotEngine 的 `updatedView`，只負責將 Pivot view 轉成既有 `fabui.Chart` 的 categories／series，不得重新彙總原始資料或複製 Chart renderer。
- `fabui.EditBox` 是 TextBox、NumberBox、DateBox、ComboBox 的單一公開替代 class，使用 `editor` 選項切換 textbox、numberbox、datebox、combobox、color 五種模式；editor 類型別名、共用 definitions、icon descriptor 與 Color palette／HSV／alpha 樣式契約必須和 FabGrid 一致。原四個 Box class 只保留為 EditBox 內部實作，不得由 `src/fabui.js`、`src/fabui.css`、`build/build.cjs` 或 `dist/fabui.*` 公開。EditBox 使用獨立 entry、CSS 與 `dist/editbox.*`，不得併入 FabGrid core bundle。Tabs 仍只保留原始碼且不列入目前產品 roadmap。
- `Window`、`Panel`、`Layout` 已列入後續元件 roadmap；樣式與 API 契約參考 jQuery EasyUI Material Teal，但不得加入 jQuery／EasyUI runtime 依賴。
- 未來發佈任何 standalone 控件時，必須建立獨立 entry、CSS、demo、API 文件與驗證；不得併回 FabGrid core bundle。
- 核心使用不綁定框架的 pure JavaScript。
- 第一版 demo 不需要後端。
- core package 不依賴 Vue。
- 資料來源選項 `remote` 預設為 `false`；`remote: true` 已支援 GET／POST、Promise loader、遠端分頁、排序、全域搜尋與欄位篩選。
- core 必須能打包成可在其他專案引用的 library 檔案。
- 發佈主檔固定為 `fabui.js`、`fabui.min.js`、`fabui.esm.js`、`fabui.esm.min.js`、`fabui.css`、`fabui.min.css`，並輸出 `dist/theme` 下的 theme CSS 與圖片依賴。
- `dist/fabui.min.js` 必須是可用 `<script>` 直接引用的 browser global 壓縮版本。
- Vue 2 Options API wrapper 位於 `packages/fabgrid-vue`，只負責把 props、events、lifecycle 對應到 pure JS core。
- Vue wrapper 使用 `fabgrid-vue` 獨立 build，不可併入 FabUI 主 bundle，也不可讓 Vue 接管 cell rendering。
- jQuery wrapper 位於 `packages/fabgrid-jquery`，使用 `$.fn.fabgrid` 對應 core options、events、methods 與 lifecycle；不得複製 core 行為或讓 jQuery 接管 cell rendering。
- jQuery wrapper 使用獨立 build，不可併入 FabUI 主 bundle；browser bundle 依賴全域 `jQuery` 與 `fabui`，ESM 入口由使用者注入依賴。
- 在大資料量情境下，Vue 不應該接管每個 cell 的渲染。

建議套件方向：

```txt
fabgrid-core
fabgrid-vue
fabgrid-jquery
```

## 現行已交付能力

以下是目前 source 與 smoke test 已涵蓋的現行功能契約，優先於後方保留的歷史 V1 規劃：

- 雙向 virtualization、左右凍結欄、固定列高與欄寬；body 凍結分隔線只能由實際渲染的資料列繪製，不得延伸到無資料空白區。
- 本機與 `remote: true` 資料模式，包含分頁、排序、全域搜尋與欄位篩選。
- `filterChanged` 會在 predicate、全域搜尋、Search Row、Excel-like 欄位篩選、模式切換與清除 filter 完成套用後觸發；遠端模式的資料完成事件仍使用 `loadSuccess`。
- `updatedView` 支援 constructor option callback，簽名為 `(grid, eventArgs)`；既有 Wijmo-compatible event object 與 native emitter API 必須保持相容。
- 1 至 3 階列群組、aggregate、群組收合狀態與 Excel 群組匯出。
- `childItemsPath` TreeGrid、節點收合／展開、同層排序、篩選祖先路徑、收合／篩選後維持原始列號與階層鍵盤導覽。樹欄所有資料 cell 右鍵都必須顯示單一「全部展開／全部疊合」狀態項目；仍有可視展開節點時顯示全部疊合，全部疊合後交換為全部展開，並由 TreeGrid class 共用既有 Grid popup 容器與關閉規則，不得只實作在 Demo。
- `allowDragging: 'Rows'` 的本機資料列拖曳、跨 Grid move、TreeGrid `before`／`inside`／`after` 節點重排與上下階；循環階層必須被拒絕。
- 左上角列頭 cell 右鍵功能表，提供搜尋列切換、清除所有篩選、「列號」下層顯示模式、Excel／CSV 匯出與 Grid fullscreen。
- `selectionMode` 支援 `Cell` 與連續矩形 `CellRange`；後者支援滑鼠拖曳、`Shift + Click`、`Shift + 方向鍵`與 TSV clipboard copy。CellRange 雙擊必須由同一資料格的連續 pointer 操作成立，`pointercancel` 不得觸發雙擊，完成 pointer 選取後不得再由 click 重複套用 selection 或 render。`highlightActiveRow` 預設為 `true`，只控制 active row 背景，不得隱含改變多選列；active cell 邊框預設為 2px，`setRowHeaderWidth(width)` 可在 runtime 調整列號欄寬並自動 refresh。
- `alternatingRowStep` 預設為 `1`；`false` 關閉交替列背景，正整數依指定列數為一組切換交替色。
- `formatItem.addHandler((g, e) => {})` 使用 `fabui.CellType` 數值列舉與相容 panel；Header、Footer、Data Cell、Row Header 的事件參數必須由單一共用流程建立，不得在各 renderer 重複定義。
- Column `cellTemplate` 使用 Wijmo-compatible `string | function | null` 契約；函式簽名為 `(ctx, cell)`，context 包含 `col`、`row`、`item`、`value`、`text`，回傳 HTML 字串或直接修改 cell 並回傳 `null`。Template 只影響 body cell 顯示，不得改變 editor、clipboard 或 export 的原始資料契約。Function callback 執行前後必須合併 cell inline style：`cell.style = customStyle` 只疊加自訂視覺樣式並保護 Grid 定位／尺寸，`cell.style = null` 還原 callback 前的 Grid 樣式。
- `g.rows` 與 `selectedRows` 回傳 `fabui.FabGrid.Row`／`fabui.FabGrid.GroupRow` instance；`GroupRow` 繼承 `Row`，群組 header 與 group footer 都必須是 `GroupRow`；不得另外公開 `fabui.grid` namespace。
- `fabui.Control.getControl(elementOrSelector)` 由 host element registry 取得 FabGrid instance；FabGrid 建立時登記、`dispose()` 時解除，找不到時回傳 `null`。
- FabGrid 繼承 `fabui.Control` 的 `addEventListener()`／`removeEventListener()`；managed DOM listeners 必須在 `dispose()` 自動解除。欄位拖曳、欄寬調整、CellRange、捲軸與資料列拖曳所需的 document pointer listener 必須只在互動期間綁定，結束、取消或 dispose 時立即解除，不得讓每個 Grid 常駐全域 pointermove／pointerup listener。`hitTest()` 使用 `fabui.CellType` 與 panel 區分資料 cell、Header、Search Row、列頭與 Footer；Search Row 屬於 `ColumnHeader` 並提供 `isSearchRow: true`。
- 欄位拖曳、欄寬調整、雙擊 header 分隔線 AutoFit、欄位顯示切換、footer aggregate。
- CSV 與 Excel 匯出，以及 Excel hidden columns、格式、凍結窗格與 autoFilter。
- JSON API 使用 `getJson(options)`、`exportJson(filename, options)` 與 `importJson(source)`；預設匯出完整 `itemsSource` 以保留 TreeGrid 階層，只有 `viewOnly === true` 才匯出排除合成群組列的目前 view。
- `textbox`、`numberbox`、`datebox`、`combobox`、`color` grid editor；`color` 支援 hex 與標準 CSS 顏色名稱，名稱提交後保留原文字；standalone 控件仍不由 core bundle 公開。
- 欄位搜尋列遇到 `datebox`、`combobox`、`color` editor 時沿用對應下拉 panel；搜尋輸入只建立 filter，不執行 cell validation。
- Header 漏斗採互斥的兩套欄位篩選：`showSearchRow: true` 使用原 Search Row 運算子，`false` 使用 Excel-like 值篩選；每次切換模式先清除另一套欄位條件，右下角 Quick Search 保留。
- Filterable Header 文字必須垂直置中，漏斗 icon 疊在右上方；icon 必須維持獨立且高於文字的 hit area，點擊只開啟篩選選單，不得觸發排序或欄位拖曳；Header 右邊界的 resize handle 必須高於 filter icon，確保拖曳調寬與雙擊 AutoFit 可用。
- `allowFiltering` 是 Search Row 與 Excel-like 欄位篩選的共用開關；設為 `false` 時必須隱藏兩套欄位篩選 UI、清除兩套欄位條件，但保留右下角 Quick Search。
- Excel-like 篩選 popup 開啟時按 `Escape` 必須只關閉 popup，不可套用或清除尚未提交的篩選草稿。
- 左上角欄位選擇器 popup 必須支援按 `Escape` 與點擊 popup 外部關閉；點擊 popup 內部或觸發按鈕不得誤關閉。
- 一般 Grid popup 由欄位 Header Row 的右鍵操作開啟，不再由左上角列頭 cell 開啟；Search Row 與一般資料列不觸發此 popup。TreeGrid 樹欄資料 cell 例外，使用同一 popup 容器顯示 TreeGrid 全部展開／全部疊合項目。
- `en`、`zh-TW`、`zh-CN` locale 與多組 theme。
- Pivot 類別與列舉只由 `fabui.pivot` namespace 公開，包含 `PivotEngine`、`PivotField`、`PivotPanel`、`PivotGrid`、`PivotChart`、`PivotWorkspace`、`PivotSlicer`、`PivotAggregate`、`PivotShowAs` 與 `PivotShowTotals`；不得在 `fabui` 頂層重複公開。PivotEngine 支援本機 Array、多階 row／column fields、value／filter fields、Sum／Count／Average／WeightedAverage／Min／Max、calculated field、小計／總計、日期 groupBy、ShowAs、viewDefinition 與 detail keys。同步 `refresh()` 必須保持相容；`refreshAsync({ batchSize })` 分批處理並回報 `progress`，`cancelRefresh()` 或新的非同步工作取消舊工作時不得以部分結果取代既有 `pivotView`。Average 只計入有效數值；Date filter 經 JSON 序列化後仍依日期值比對；`setFields()` 必須依穩定 field key 將四個 View 區域重綁到新的 PivotField instance。
- PivotPanel 沿用 FabGrid theme variables，提供 Fields／Filters／Rows／Columns／Values 區域、欄位勾選與滑鼠／觸控拖放、排序、filter field 多值草稿配置、Rows／Columns 欄位右鍵預設／升冪／降冪排序 popup、數值欄位右鍵 aggregate／ShowAs 設定及 JSON 字串 viewDefinition；所有 popup 必須沿用既有左側 icon 欄、分隔線、緊湊列高、hover／active 與 `Escape`／點擊外部關閉規則。Filters chip 只顯示欄位名稱與操作；內容可由該 chip 的多值篩選 dialog、PivotGrid 左上角或共用同一 Engine 的 PivotSlicer 設定。未按「套用」的 filter 草稿不得寫入 PivotField。Values chip 必須優先清楚顯示欄位名稱，不得放置會壓縮名稱的 inline aggregate select。Filters、Rows、Columns、Values 都不顯示上下移動按鈕，統一以拖曳排序並以插入橫線提示實際落點。Panel、Grid、Chart 與 Slicer 必須共用同一個 PivotEngine，不得在 Demo 複製彙總邏輯。
- PivotGrid 繼承 FabGrid，固定為唯讀並重用雙向 virtualization、CellRange、clipboard、匯出、Control lifecycle、Grid fullscreen、popup 規則與 theme variables；支援多層欄標頭、固定 row fields、列／欄 subtotal 展開收合、dimension 預設／升冪／降冪三態排序、Pivot 右鍵選單及雙擊明細。Row field 右鍵選單必須以單一「全部展開／全部疊合」狀態項目操作所有列與欄群組，不得顯示單一「展開群組／疊合群組」項目；所有 PivotGrid 右鍵 popup 點擊外部必須立即關閉，點擊 popup 內部不得先關閉而阻斷項目操作，並維持 `Escape` 關閉；Header Cell 右鍵選單必須提供進入／離開 PivotGrid 全螢幕，資料 Cell 選單維持原有功能。列欄位 Header 排序必須依「預設 → 升冪 → 降冪 → 預設」循環，預設狀態保留原始出現順序且不顯示排序符號，從 Grid 變更排序或 aggregate 時必須觸發 `viewDefinitionChanged`。重複的父層 row field 值必須疊合為跨越明細與小計列的單一 cell，展開／收合按鈕放在父層值旁，收合後只保留該群組的小計列。Pivot view 更新、排序或疊合後必須依 row key 與 data-column key 保留邏輯選取，原資料不可見時才 clamp。PivotGrid 預設 Excel 匯出必須保留疊合子欄與明細列資料，並在工作表分別維持 hidden column／hidden row；只有 `visibleOnly === true` 才排除目前不可見欄位，疊合列明細仍須保留為 hidden row。PivotPanel Filters 區的欄位必須依序同步顯示在 PivotGrid 左上角、row field 標頭上方，內容選擇只在 PivotGrid 顯示並寫入同一個 `PivotField.filter`；不得以 `columnFields` 取代 filter field 來源。
- PivotGrid 列／欄 `＋／−` 必須單次滑鼠點擊立即生效，不得先被 CellRange pointer 流程重繪而需要第二次點擊。
- PivotChart 預設只顯示 leaf row／column aggregates，避免 subtotal／grand total 重複計算；`showTotals: true` 才納入目前可見的總計。Column／Bar／Line 可顯示多 series，Pie 由 `selectedSeries` 選擇單一 series；Pie 預設使用 Point selection、在扇形內顯示百分比，點擊後必須沿用 `fabui.Chart` 的旋轉與扇形位移動畫。PivotChart 傳入共用同一個 PivotEngine 的 PivotGrid 作為 `selectionSource` 後，必須監聽 Grid `refreshed`，依目前疊合／展開狀態重建圖表：展開群組顯示 leaf aggregates，疊合群組以可見 subtotal 取代隱藏明細，不得重新彙總原始資料；圖形 point 與 Grid 彙總 cell 必須依 Pivot row key 及 data-column binding 雙向同步選取，Pie 由 Grid 反向選取時同步切換 `selectedSeries`。`maxPoints`／`maxSeries` 只限制 SVG 繪製量，不得修改 PivotEngine view。
- PivotWorkspace 位於 `fabui.pivot.PivotWorkspace`，只負責建立／接收單一 PivotEngine、組合既有 PivotPanel／PivotGrid／PivotChart、Pane 顯示狀態、自適應排列、非同步彙總狀態與 Splitter lifecycle；不得複製 Pivot 彙總、Grid renderer 或 Chart renderer。Workspace 必須顯示非同步進度、取消與錯誤狀態，並以 `refreshAsync()`／`cancelRefresh()` 轉交同一 Engine。預設 Auto layout 依 host 寬度在三欄與三列間切換；Horizontal `chartSize` 接受正數 px、百分比字串或 `fr` 字串，預設 `'40%'`，百分比／`fr` 以扣除可見 Panel 與 Splitter 後的 Grid＋Chart 空間計算，Grid 為隱含 `1fr`，拖曳 Chart Splitter 後轉為固定 px。兩條 Splitter 必須支援 pointer drag 與鍵盤方向鍵，document pointer listener 只在拖曳期間綁定並於結束、取消或 dispose 立即解除。PivotGrid 標題列內建定義區／圖表區顯示切換與完整 Grid Pane 全螢幕按鈕，PivotChart 標題列內建多語系圖形類型選單與完整 Chart Pane 全螢幕按鈕；全螢幕必須包含標題列與內容並支援再次按鈕或 `Escape` 離開，瀏覽器不支援 Fullscreen API 時必須使用固定定位 fallback，Demo 不得重複實作這些控制項。隱藏 Panel／Chart 時相鄰 Splitter 一併隱藏，Grid 必須擴展並 refresh，Chart 必須 resize。Workspace 公開 `engine`、`panel`、`grid`、`chart`。
- Vue 2 與 jQuery wrapper 必須提供 PivotPanel、PivotGrid、PivotChart、PivotWorkspace、PivotSlicer 的薄層 component／plugin；只負責 options、methods 與 lifecycle，不得複製 PivotEngine、Grid 或 Chart 行為。
- Server-side Pivot／OLAP／SSAS 不列入目前產品範圍。
- PivotGrid source-mode Demo 固定為 `demo/dev-pivot.html`；build-mode 正式 Demo 固定為 `demo/pivot.html`。兩個 Demo 的 PivotGrid 標題列都不得顯示「全部疊合／全部展開」按鈕，全部群組操作保留在列欄位右鍵選單。Source-mode 桌面版顯示 PivotPanel／PivotGrid／PivotChart 三區，提供隱藏／開啟定義與隱藏／開啟圖表；圖表類型選擇的 Column／Bar／Line／Pie 顯示文字必須跟隨 `zh-TW`、`zh-CN`、`en` Demo locale pack。隱藏任一 Panel 時 PivotGrid 必須擴展並 refresh，重新顯示 PivotChart 時必須 resize。Build-mode 在使用者明確要求 build 時同步相同功能；日常 source 修改不得主動更新 `dist`。
- PivotWorkspace source-mode Demo 固定為 `demo/dev-pivot-workspace.html`；build-mode 正式 Demo 固定為 `demo/pivot-workspace.html`。兩者皆使用單一 `100dvh` 工作區且頁面本身不得產生捲軸，工具列皆提供主題、語系、排列方式與 Pivot View 範例切換；正式 Demo 只引用 `dist/fabui.min.js` 與 `dist/fabui.css`，日常 source 修改不得主動更新 `dist`。
- 兩個 Pivot Demo 都使用單一 `100dvh` RWD 工作區，文件本身不得產生水平或垂直捲軸，資料捲動留在 PivotPanel／PivotGrid／PivotChart 內部；窄畫面改為上下排列。正式 `demo/pivot.html` 上下左右固定保留 10px，且只引用 `dist/fabui.min.js` 與 `dist/fabui.css`。
- PivotGrid 的原始資料篩選由 PivotField 在 aggregate 前處理；不得啟用一般 FabGrid Search Row／Excel-like filter 來篩選彙總後的 view。

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
- `demo/dev-grid-chart.html` 是 source-mode 開發版，引用 `src/fabui.js`；`demo/grid-chart.html` 是 build-mode ES5 語法範例，只引用 `dist/fabui.min.js` 與 `dist/fabui.css`。兩版都要保留並維持 2 x 2 Grid／Column-Bar／Line／Pie 範例。
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

本節保留初始決策背景，其中 remote data、pagination、grouping、clipboard、Tree grid 等項目後來已交付；現況以「現行已交付能力」、README、API 文件與測試為準。

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
src/grid/fabgrid-drag.js    row pointer drag、跨 Grid drop、TreeGrid drop 協調
src/grid/fabgrid-editor.js  grid editor mask、caret 與 validation helpers
src/grid/fabgrid-editor-runtime.js  cell editing、editor panel 與 validation lifecycle
src/grid/fabgrid-export.js  CSV、XML 與 Excel 共用序列化工具
src/grid/fabgrid-filter-ui.js  Search Row、Excel-like filter、column chooser 與 popup UI
src/grid/fabgrid-selection.js  selection、keyboard、clipboard、column drag／resize
src/grid/fabgrid-tree.js    TreeGrid 可視列、節點狀態與互動
src/grid/fabgrid-view.js    layout、scrollbar、雙向 virtualization 與 rendering
src/grid/fabgrid.css        FabGrid 核心樣式
src/fabui.icon.css          FabUI icon 樣式入口
```

FabGrid 專用程式統一放在 `src/grid/`；只有確認可由其他 FabUI 元件共用的定義才放在 Grid 目錄外。`src/grid/fabgrid.js` 保留 factory、公共 API、事件、DOM lifecycle 與模組安裝協調，且不得改變公開 API；view、filter UI、selection 與 editor runtime 由各自領域模組負責。

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

Vue wrapper 已以 Vue 2 Options API 實作於 `packages/fabgrid-vue`，不得為了 wrapper 複製或改寫 FabGrid core 行為。

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
- props watcher 只監聽 root reference，呼叫 core setters；大型 `itemsSource` 與 `columns` 不使用 deep watch。
- Vue 2 大型唯讀資料 Demo 使用 `Object.freeze(rows)` 避免 deep observer；資料更新以替換 root array reference 進行。
- 將 core events 轉成 kebab-case Vue events，handler 必須在 destroy 時解除。
- `control` 保持 non-reactive，透過 component ref 公開底層 FabGrid instance。
- `columns` prop 優先於 declarative `FabGridColumn`，兩者不可合併。
- browser wrapper bundle 依賴全域 `Vue` 與 `fabui`，ESM bundle 公開 `createFabGridVue(Vue, fabui)` factory。
- wrapper build 完整輸出到 `packages/fabgrid-vue/dist`，並將 `vue.min.js`、browser global `fabgrid-vue.js` 與 `fabgrid-vue.min.js` 同步到 `dist/wrapper`；不得併入 `dist/fabui.*` 主 bundle。
- Vue Demo 固定使用 `demo/grid-vue2.html`，依序載入 `dist/wrapper/vue.min.js`、`dist/fabui.min.js` 與 `dist/wrapper/fabgrid-vue.min.js` browser global，再由 SystemJS runtime loader 動態載入 `demo/js/grid-vue2.vue`。目前不提供獨立 production HTML；不得恢復已移除的 `demo/vue2-grid-app.html`，除非使用者明確要求新的發布流程。
- Vue Demo 的工具列、欄位 editor、theme、locale、群組、篩選、remote、Popup Grid、匯出與 runtime stats 必須和 `demo/dev-grid.html` 保持同等功能；Vue 只負責 wrapper props、events 與 Demo 狀態，cell rendering 仍由 core 處理。
- Vue Demo 的 Options API、locale、資料處理與 helper 全部直接放在 `demo/js/grid-vue2.vue`；不得再拆出 `demo/js/grid-vue2-options.js` 或透過 `window.createVue2GridDemoOptions` 組裝元件。
- `demo/grid-grid-vue2.html` 是專用雙 Grid 拖曳範例，必須沿用 `demo/grid-vue2.html` 的 SystemJS runtime loader 掛載 `demo/js/grid-grid-vue2.vue`，並載入 Vue、FabUI 與 Vue wrapper browser global bundle；上方按鈕透過 wrapper `allowDragging` prop 同步開啟／關閉兩個 Grid 的資料列拖曳，Vue 管理資料與頁面狀態，Grid cell rendering 仍由 core 負責。
- `demo/grid-treegrid-vue2.html` 必須沿用 `demo/grid-vue2.html` 的 SystemJS runtime loader 掛載 `demo/js/grid-treegrid-vue2.vue`，並使用既有 Vue 2 wrapper 建立 Grid／TreeGrid component；上方按鈕透過 wrapper `allowDragging` prop 同步開啟／關閉 Grid 與 TreeGrid 的資料列拖曳，Vue 管理資料與頁面狀態，cell rendering 與 row drag 仍由 core 負責。
- Pure JS、Vue 2 與 jQuery Demo 的上方工具列 HTML 結構統一由 `demo/js/grid-toolbar.js` 產生；各 Demo 保留自己的狀態、事件與框架綁定，不得複製工具列 markup。

V1 不提供 Vue cell slot、editor slot 或逐 cell component mount，避免 Vue 負責渲染 virtualized cells。

## jQuery Wrapper 筆記

- jQuery wrapper 位於 `packages/fabgrid-jquery`，公開 `$.fn.fabgrid`，每個 host element 對應一個 `fabui.FabGrid` instance。
- 初始化、setter、無回傳值方法與 `destroy` 保持 jQuery chaining；`instance`、option getter 與有回傳值的 core method 回傳實際結果。
- 重複傳入 options 更新既有 instance，不建立第二個 Grid；具有正式 core setter 的 option 必須優先呼叫 setter。
- core events 轉為小寫 jQuery events，固定使用 `.fabgrid` namespace；取消狀態必須回傳 core event args。
- `destroy` 必須解除 wrapper 的 core event handlers、呼叫 `dispose()` 並清除 instance data，不得移除使用者自己的 jQuery events。
- wrapper build 完整輸出到 `packages/fabgrid-jquery/dist`，browser minified 版本另同步到 `dist/wrapper/fabgrid-jquery.min.js`；不得併入 `dist/fabui.*` 主 bundle。
- `demo/dev-jquery-grid.html` 是 source-mode 開發 Demo；`demo/grid-jquery.html` 是 build-mode browser global Demo，只引用 `dist` core 與 wrapper bundle。日常修改不得為了 jQuery wrapper 主動 build。
- jQuery Demo 必須先載入 `demo/js/grid-jquery.js` adapter，再載入共用 `demo/js/grid.js`；初始化、公開方法與事件必須明確經過 `$.fn.fabgrid` 與 jQuery events，不得只在建立後改用 core instance 操作。
- `demo/js/grid-jquery.js` 只負責 jQuery adapter，不得複製 `demo/js/grid.js` 的資料、Popup、locale、toolbar 或篩選流程；runtime property 可透過 wrapper option／instance getter 讀取，但所有會改變 Grid 狀態的公開操作必須使用 `$host.fabgrid(...)`。
- jQuery Demo 建立 Grid 後必須保留 `data-demo-adapter="jquery"` 標記，供人工檢查與自動驗證確認實際走 wrapper。

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
