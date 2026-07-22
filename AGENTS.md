# FabGrid 專案筆記

## 語言與風格

- 回覆使用者時一律使用繁體中文。
- 代碼註釋必須使用英文。
- 代碼縮排一律使用兩個空白，不使用 tab。

## Git 與 GitHub 工作規則

- 可以依任務需要建立本地 commit，但不要主動推送到 GitHub。
- 只有在使用者明確要求「上傳」、「推送」、「同步到 GitHub」或同等意思時，才執行 `git push` 或 GitHub 遠端操作。
- 除非使用者明確要求建立或切換分支，否則不得自行建立分支或切換離開目前分支；`build`、`push`、發佈或一般開發要求都不代表授權建立新分支。
- 不得只根據受限沙箱內一般文字格式的 `gh auth status` 輸出判定 GitHub token 失效；DNS 解析失敗、無法連線 `api.github.com` 或其他網路限制都必須先視為環境問題。應先以 `gh auth status --hostname github.com --json hosts` 檢查結構化錯誤，並在允許網路的環境重試 GitHub／Git 操作；只有在網路可用且 GitHub 明確回覆認證失敗時，才可告知使用者 token 失效或要求重新登入。

## 開發工作流程

- 修改範圍、需求意圖或既有行為是否應保留，只要有任何不確定，必須先向使用者確認清楚再修改；不得自行擴大需求、移除未被要求移除的功能或改變未被要求改變的行為。
- `res/` 位於專案根目錄，只存放本機參考檔案；build、Demo 與正式 source 不得依賴，Git/GitHub 必須忽略。
- 日常修改不要每次都編譯到 `dist`。
- 除非使用者明確要求「編譯」、「build」、「重建 dist」、「產生 dist」或同等意思，否則不要主動執行會更新 `dist` 的指令，例如 `npm run build` 或 `npm run smoke`。
- Build 命令固定依照以下範圍執行：
  - `build`／`build fabui`：執行 `npm run build`，只編譯 `fabui.*`，不包含 Diagram、`fabui.lite.*`、`fabui.gantt.*` 與 `fabui.scheduler.*`；`dist/fabui.*` 不得包含 Diagram JavaScript 或 CSS。
  - `build lite`：執行 `npm run build:lite`，只編譯 `fabui.lite.*`。
  - `build diagram`：只編譯獨立 Diagram，產生 `dist/fabui.diagram.js`、`dist/fabui.diagram.min.js`、`dist/fabui.diagram.css` 與 `dist/fabui.diagram.min.css`，不得重新編譯或寫入 `dist/fabui.*`。
  - `build gantt`：執行 `npm run build:gantt`，只編譯 `fabui.gantt.*`。
  - `build scheduler`：執行 `npm run build:scheduler`，只編譯 `fabui.scheduler.*`。
  - `build theme`：執行 `npm run build:theme`，只編譯 `dist/theme/` 下的 theme CSS 與圖片依賴，不得重新編譯或刪除其他 `dist/` 輸出；`build theme min` 執行 `npm run build:theme -- min`。
  - `build clear`：只清除 `dist/` 下的所有檔案與資料夾並保留 `dist/` 目錄本身，不得執行任何編譯。
  - `build all`：依序執行 `npm run build`、`npm run build:lite`、`build diagram`、`npm run build:gantt`、`npm run build:scheduler`，編譯以上全部發佈輸出；一般 `build` 已包含 theme，因此不重複執行 `build theme`，也不得額外執行 `build clear`。
  - 可用半形逗號一次指定多個編譯範圍，格式固定為 `build <scope>,<scope> [min]`，逗號左右不得有空白；例如 `build fabui,diagram min` 必須依序編譯 FabUI core 與 Diagram，並對兩個範圍都套用 `min`。可組合的 scope 為 `fabui`、`lite`、`diagram`、`gantt`、`scheduler`、`theme`，依使用者列出的順序各執行一次；重複 scope 只執行第一次。`all` 與 `clear` 必須單獨使用，不得放入逗號清單，也不得和其他 scope 組合。
  - 所有編譯命令都可在尾端加上 `min`，包含 `build min`、`build lite min`、`build diagram min`、`build gantt min`、`build scheduler min`、`build theme min` 與 `build all min`。加上 `min` 時，只產生並保留該範圍內檔名含 `.min.` 的壓縮版 JS／CSS，不得產生或保留同範圍的非壓縮輸出；`build diagram min` 只產生並保留 `dist/fabui.diagram.min.js` 與 `dist/fabui.diagram.min.css`；theme 所需圖片依賴仍須保留。`build clear` 不適用 `min`。
- 所有 build 命令一律不得產生 `.esm.js`、`.esm.min.js` 或其他 ESM 發佈檔；只輸出 browser global JavaScript、壓縮 JavaScript、CSS、壓縮 CSS 與必要 theme／圖片資產。
- Diagram、Gantt 與 Scheduler 必須保持獨立 bundle，不得併入 `fabui.*` core。Vue 2 與 FabGrid jQuery wrapper 目前暫緩，不得納入上述 build 命令。既有 Vue 2 與 FabGrid jQuery wrapper 原始碼及獨立 build script 保留，只有使用者未來明確要求恢復或單獨編譯 wrapper 時才可使用。FabUI EditBox jQuery wrapper 已移除，不得重新加入預設或獨立 build。
- 修改確認完成後，預設啟動開發伺服器，提供本機網址讓使用者自行測試。
- 所有 `demo/*.html`、共用 Demo 設定與動態產生的 theme selector 都必須以 `default` 作為初始主題；選擇其他 theme 時必須更換外部 Theme CSS 並重新載入頁面，不得以 runtime theme class 動態切換。
- 若任務需要驗證但使用者沒有要求編譯，優先使用不會改寫 `dist` 的檢查方式；如果現有驗證只能透過 build/smoke 完成，先回報限制並等待使用者指示。
- FabUI 使用的 icon 定義統一放在 `src/fabui.icon.css`，例如 `icon-datebox`、`icon-refwin`；不要在核心 CSS 直接硬編圖檔路徑。
- 開發測試優先使用 source-mode `demo/dev-grid.html`，直接引用公開入口 `src/fabui.js` 與 `src/fabui.css`；build-mode 主 Demo 固定為 `demo/grid.html`。內部模組仍放在各自目錄。修改 source 後要同步更新 query version，避免瀏覽器快取造成誤判。
- 除 Demo 索引 `demo/dev.html` 與 `demo/index.html` 外，所有 Demo 畫面上的按鈕、下拉、輸入、checkbox、radio 與 file 欄位都必須優先使用對應 FabUI 元件；共用補強集中於 `demo/js/demo-controls.js`，`dev-*.html` 由 `demo/js/dev-controls.js` 注入 `src/` FabUI，非 `dev-*.html` 由 `demo/js/dist-controls.js` 注入 `dist/` FabUI，不得在個別 Demo 以硬編 CSS 仿造元件。Demo CSS 只負責頁面排版，不得以通用 `button`／`select`／`input` selector 覆蓋 `.fui-*` 的框線、背景、padding、icon、字型或互動狀態。`demo/dev.html` 必須以一般文字 `<a>` 連結並列開發版與正式版，只有第一欄 Demo 項目可由 `demo/js/dev-index.js` 原生上下拖曳調整當次顯示順序；開發版與正式版連結不可拖曳，滑鼠移入時必須維持一般箭頭指標。`demo/index.html` 只列正式版，排列順序必須跟隨 `demo/dev.html` 中具有正式版連結的項目。兩個索引不得載入 FabUI CSS／JavaScript，也不得將連結轉成 FabUI Button。
- 新增任何核心 UI 文字時，必須同步補齊 `en`、`zh-TW`、`zh-CN` locale key；三組 locale pack 的 key 必須一致，且 `zh-Hant`／`zh_Hant_TW` 要正規化為 `zh-TW`、`zh-Hans`／`zh_CN` 要正規化為 `zh-CN`。demo-only 文字若會隨語言切換，也要放進 demo locale pack，不要寫死單一語言。
- 所有支援 theme 的公開元件都必須公開相同的 19 組 `themes` metadata；第 17 至 19 組為 `mono`、`mono-red`、`mono-green`，分別使用 Metro Gray、Metro Red、Metro Green 的版面色調，並共用 `src/theme/mono/images/` 的單色 SVG。三組 Mono theme 的 PNG sprite 都必須拆成相對應的獨立 SVG，CSS 不得引用 PNG／GIF。Build 必須另外輸出同名檔案到 `dist/theme/mono/` 並讓三組正式 Mono CSS 引用該資料夾。`fabui.css`、`fabui.min.css` 與 Lite CSS 只內建 Default 配色；其他 18 組 Theme CSS 必須使用相同固定 selector，載入於所有 FabUI／附加元件 CSS 之後直接覆蓋 Default，不得依賴 `fg-theme-*` class。Chart 與其他核心視覺不得硬編只適用淺色主題的文字、背景或線條顏色，應沿用共用 theme variables。
- popup menu 樣式要維持一致：左側 icon 欄、icon 後分隔線、緊湊列高與清楚 hover/active 狀態；後續新增 popup menu 時沿用目前 filter menu 的視覺規則。
- 所有既有與未來新增的 popup 都必須支援按 `Escape` 與點擊 popup 外部關閉；點擊 popup 內部或其 trigger 不得誤關閉。關閉只負責收起 popup，不得隱含套用、清除或提交尚未確認的內容；同時開啟多個 popup 時，點進其中一個也必須關閉其餘 popup。Popup 所需的 document／window listener 只在開啟期間綁定，關閉或 dispose 時必須立即解除。
- 工作進度記錄放在 `worklogs/YYYY-MM-DD.md`，固定使用 `## 完成進度` 標題；功能契約改動時，同步更新 README 與本文件。
- Excel 預設匯出完整欄位集合，隱藏欄位必須保留資料並在工作表標記為 hidden；只有明確傳入 `visibleOnly === true` 時才只匯出可見欄位。
- FabGrid 欄位顯示切換統一使用 `setColumnVisible(column, visible)`；`column` 只接受 `grid.columns` 的 index 或該 Grid 的 column object。依 `binding` 操作時必須先用 `getColumn(binding)` 取得 column object，不得直接把 binding 字串傳入 `setColumnVisible()`；也不得只修改 `grid.columns[index].visible` 而略過 layout、選取狀態與畫面更新。
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

- `fabui` 是最上層 UI namespace，Browser global 發佈入口目前輸出 FabGrid、Chart 與其必要定義。
- Browser global 以 `fabui.version` 公開 `YYYY.M.D` 格式的發佈日期版本，每次 build 依本機當天日期自動產生。
- FabGrid 與 `fabui.EditBox` 共用的 editor 定義位於 `src/editbox/editbox-definitions.js`，由 core bundle 的 `fabui.editorDefinitions` 與 `fabui.EditBox.editorDefinitions` 公開；不可在 Grid 內維護多套數字／時間／日期清理、格式化或 editor class。`src/editor/editor-definitions.js` 只保留舊 import path 相容入口。
- FabGrid 與 `fabui.EditBox` 的日期 popup 共用 `src/editbox/date-popup.js`；Calendar DOM、月份選單、鍵盤導覽、outside click、`Escape` lifecycle 與 `.fui-calendar-*` 樣式以 EditBox 視覺為唯一基準。Grid 只保留 cell／Search Row 的日期寫回邏輯，不得另建 `fg-datebox-*` renderer 或 CSS。
- 共用 DatePopup 的 `showLunar` 預設為 `false`；設為 `true` 時在國曆日期下方顯示農曆日期，FabGrid cell editor、Search Row 與 `fabui.EditBox` 必須沿用同一個 option、轉換與 DOM／CSS，不得各自實作農曆 renderer。
- 共用 DatePopup 的 Calendar theme 樣式以本機 `res/themes/*/calendar.css` 為視覺參考，但 source、Demo 與 build 不得依賴 `res/`。Date EditBox、FabGrid popup 與其他附加到 `body` 的 popup 都必須使用固定 component selector，並由頁面最後載入的 Theme CSS 統一決定配色；既有 `theme`／`setTheme(theme)` 僅保留 API 相容，不得再作為配色載入或切換機制。
- FabGrid 與 `fabui.EditBox` 的清單 popup 共用 `src/editbox/combo-popup.js`；option、group、active／selected 狀態、鍵盤導覽、寬度量測、outside click、`Escape` lifecycle 與 `.fui-combobox-*` 樣式以 EditBox 視覺為唯一基準。Combo EditBox 的 `fitContent` 預設為 `true`，Popup 以 EditBox 寬度為下限，內容較長時自動加寬，並受 `panelMaxWidth` 與 viewport 限制。Grid 只保留 cell／Search Row 的資料過濾、驗證與值寫回邏輯，不得另建 `fg-combobox-*` popup renderer 或 CSS。
- FabGrid 與 `fabui.EditBox` 的顏色 popup 共用 `src/editbox/color-popup.js`；色票、HSV、Alpha、pointer drag、outside click、`Escape` lifecycle 與 `.fui-colorbox-*` 樣式以 EditBox 視覺為唯一基準。Grid 只保留 cell／Search Row 的顏色寫回邏輯與顏色名稱原樣保存契約，不得另建 `fg-color-*` popup renderer 或 CSS。
- FabGrid 年月編輯統一使用 `date`；當 mask 為 `9999/99` 或 `9999-99` 時，popup 固定使用年份／月份選擇模式，不另外定義年月專用 editor。FabGrid 與 `fabui.EditBox` 的 DateBox `autoUnmask` 預設皆為 `true`，複製日期／年月內容時必須移除遮罩字面值；只有明確設定 `autoUnmask: false` 時才保留遮罩。
- `fabui.EditBox` 與 FabGrid number cell editor 都以 `spinner` 控制數值增減箭頭：`true`／`'right'` 顯示於右側，`'left'` 顯示於左側，預設 `false`；Spinner 預設使用與 Date／Combo／Color trigger 相同的 28px 寬度、theme trigger 背景與 icon 色，每次依 `increment` 增減並沿用 `min`、`max`、`precision`、disabled、readonly 與 change／cell edit event 契約，公開 option 名稱統一為 `spinner`。FabGrid 啟用 Spinner 時，`ArrowUp`／`ArrowDown` 增減數值且不移動 cell；Search Row 不顯示 Spinner。
- FabGrid 位於 `fabui.FabGrid`；`src/fabui.js` 是入口，`src/grid/fabgrid.js` 是 Grid 子模組。
- FabGrid 的 `activeCellBorder` 預設為 `1`，active cell 與 cell editor 必須共用此邊框寬度；設為 `0` 時隱藏邊框。
- Chart 位於 `fabui.Chart`；使用 pure JavaScript SVG rendering，只支援直條圖、橫條圖、折線圖與圓餅圖，原始碼位於 `src/chart/` 並納入主 bundle。
- PivotChart 位於 `fabui.pivot.PivotChart`；直接監聽共用 PivotEngine 的 `updatedView`，只負責將 Pivot view 轉成既有 `fabui.Chart` 的 categories／series，不得重新彙總原始資料或複製 Chart renderer。
- `fabui.EditBox` 與 FabGrid 的公開 editor 名稱統一為 `text`、`number`、`time`、`date`、`combo`、`color`。舊 `textbox`、`numberbox`、`timebox`、`datebox`、`combobox` 僅保留為相容別名，CSS class 名稱不必跟著改。Time EditBox 與 FabGrid time cell editor 預設 `mask: '99:99'`、`autoUnmask: true`、`spinner: false`，也支援 `99:99:99`；採一般 24 小時規則，分秒只接受 `00`–`59`，只有完整 `24:00`／`24:00:00` 可作為上限，Spinner 依游標所在時／分／秒段落調整。`fabui.EditBox` 是各 Box 實作的單一公開替代 class；內部原始碼統一放在 `src/editbox/`，不得再建立分散的 `src/*box/` 目錄，也不得在 `fabui` 頂層公開個別 Box class。`fabui.EditBox` 必須納入 `src/fabui.js`、`src/fabui.css`、`build/build.cjs` 與 `dist/fabui.*`，不得另行輸出 `dist/editbox.*`。
- FabGrid cell editor、Search Row 與 `fabui.EditBox` 的 icon descriptor 公開標準欄位統一為 `iconCls`、`title`、`ariaLabel`、`text`、`width`、`align`、`keepFocus`、`onClick`，並由 `src/editbox/editor-icons.js` 單次正規化；`className`／`iconClass`／`icon`、`label`、`click`／`handler` 只保留舊寫法相容，renderer 不得各自重複解析別名。
- `fabui.Button` 已由 FabUI core 公開，原始碼位於 `src/button/`；API 與視覺參考 jQuery EasyUI LinkButton／Default theme，host 一律使用 `<a>`，支援尺寸、disabled、plain、outline、toggle、group、四方向 `iconCls`、theme、Control registry 與 dispose 還原，icon 預設位於文字左側，統一使用 `icon-xxx` 並由 `src/fabui.icon.css` 定義。`fabui.Calendar` 位於 `src/calendar/`，API 與視覺參考 jQuery EasyUI Calendar／Default theme；必須以嵌入模式共用 `src/editbox/date-popup.js` 的 renderer、月份選單、農民曆與 `.fui-calendar-*` 樣式，不得維護第二套 Calendar DOM，`showLunar` 預設為 `false`。`fabui.Tabs` 位於 `src/tabs/`，API 與視覺參考 jQuery EasyUI Tabs／Default theme，支援 markup／programmatic panels、動態新增／插入／更新／關閉、tab tools、header tools、四方向、overflow、遠端內容、keyboard、theme、locale、Control registry 與 dispose；所有 icon 一律使用 `iconCls: 'icon-xxx'` 並由 `src/fabui.icon.css` 定義。`fabui.Panel` 已由 FabUI core 公開，原始碼位於 `src/panel/`；提供 header／body／footer、custom tools、狀態、遠端 lazy load、cache、theme、locale、Control registry 與可取消 lifecycle；最大化／還原、收合／展開預設使用 180ms 過渡動畫，支援關閉動畫並遵守 `prefers-reduced-motion`。`fabui.Window` 位於 `src/window/`，另提供浮動定位、拖曳、八方向縮放、modal mask 與置中；八方向 pointer 縮放期間只更新獨立虛線 proxy，不得改變 Window options、實際 geometry 或觸發內容重排，pointer up 才一次提交位置／尺寸並發出 `Resize`，pointer cancel 必須放棄預覽；右上角預設只顯示最大化／還原與關閉，狀態切換使用可關閉的過渡動畫，疊合後只保留約 38px 高的標題列，展開時恢復原高度；最小化預設保留約 220×38px 標題列並停靠可用範圍左下角，也可用 `minimizeTarget` 指定 Element、selector、rect 或 function，讓最小化／還原動畫精確對準單一目標矩形；最小化工具切換為還原，點擊後回復原位置與尺寸，viewport resize listener 只在最小化期間綁定；左上角標題 icon 統一使用 `iconCls: 'icon-xxx'` 並由 `src/fabui.icon.css` 定義。Panel 與 Window 的收合、展開、最小化、最大化、還原與關閉 icon 必須使用各 theme 對應的 `src/theme/<theme>/images/panel_tools.png`，sprite 定義集中於 `src/fabui.icon.css`；Panel 的收合／展開 icon 與 Window 這六種內建 icon 不得顯示滑鼠 hover 背景或透明度變化，但必須保留鍵盤 `focus-visible` 提示；既有 16 組 header、body、footer、frame、gradient、shadow、mask 與其他 tool hover 樣式必須逐一對應本機 `res/themes/<theme>/panel.css`／`window.css`，正式 source、Demo 與 build 不得依賴 `res/`。`fabui.Layout` 位於 `src/layout/`，north／south／east／west／center 五區必須重用 `fabui.Panel`，Layout 只維護 dock geometry、collapsed bar、float／dock expand、pointer／keyboard Splitter、動態 add／remove、split／unsplit、巢狀 resize 與 lifecycle，不得複製 Panel renderer；edge region 收起／展開必須同步動畫 center、Splitter 與 collapsed bar，預設啟用並遵守 `prefers-reduced-motion`。Layout 收合／展開 icon 不得顯示滑鼠 hover 背景或透明度變化；Splitter hover 不得變色，拖曳時只允許目前操作的單一分隔線使用 active 色。Pointer 拖曳期間只能移動 Splitter 預覽，不得更新 region options、Panel geometry 或觸發內容重排；pointer up 才一次提交尺寸與發出 `RegionResize`，pointer cancel 必須放棄預覽。Layout 的既有 16 組 Splitter、active proxy、collapsed bar、border、文字與箭頭 sprite 必須逐一對應本機 `res/themes/<theme>/layout.css`／`images/layout_arrows.png`，箭頭定義集中於 `src/fabui.icon.css` 並使用 `src/theme/<theme>/images/` 資產，正式 source、Demo 與 build 不得依賴 `res/`。這些元件不得加入 jQuery／EasyUI runtime 依賴。
- `fabui.Accordion` 位於 `src/accordion/`，API 與視覺參考 jQuery EasyUI Accordion；每個 pane 必須直接建立既有 `fabui.Panel`，Accordion 只維護單一／多重展開、collection API、三方向排列、尺寸、鍵盤、ARIA、theme、locale、Control registry 與 dispose，不得複製 Panel renderer、遠端 loader 或 lifecycle。Header 箭頭使用各 theme 對應的 `src/theme/<theme>/images/accordion_arrows.png`，定義集中於 `src/fabui.icon.css`；收合狀態必須顯示 expand 箭頭，展開狀態必須顯示 collapse 箭頭。展開／收合預設使用 180ms 的 Panel 尺寸、Accordion flex 比例、內容透明度與 header 色彩過渡動畫，並遵守 `prefers-reduced-motion`；既有 16 組容器、一般 header、selected header、文字與箭頭樣式必須逐一對應本機 `res/themes/<theme>/accordion.css`，正式 source、Demo 與 build 不得依賴 `res/`。
- `fabui.Scheduler` 是獨立附加元件，原始碼位於 `src/scheduler/`，source 入口為 `src/fabui.scheduler.js`／`src/fabui.scheduler.css`，輸出固定為 `dist/fabui.scheduler.js`、`.min.js`、`.css`、`.min.css`。原本 `src/fabui.js`、`src/fabui.css` 與 `dist/fabui.*` 不得匯入或公開 Scheduler；Browser global 必須先載入 `fabui.*` 再載入 `fabui.scheduler.*`，獨立 bundle 只附加 `fabui.Scheduler`，不得建立第二份 `fabui`。Scheduler 使用 pure JavaScript，支援 Day／Work Week／Week／Month／Year／Agenda／Timeline、本機行程 CRUD、全天行程、resource color、拖曳移動、調整結束時間、鍵盤、三語系、19 組 theme、Control registry 與 dispose；工具列與編輯器必須重用既有 `fabui.Button`、`fabui.Window`、`fabui.EditBox`、`fabui.CheckBox`，不得複製這些 renderer。Document pointer listener 只在拖曳／調整期間綁定，pointer up、pointer cancel 或 dispose 時立即解除，pointer cancel 不得提交變更。
- `fabui.CheckBox` 位於 `src/checkbox/`，API 與視覺參考 jQuery EasyUI CheckBox／Default theme；必須保留原生 `<input type="checkbox">` 的表單 name/value、label、鍵盤、disabled 與 reset 語意，label position 預設為 `after`，支援尺寸、checked、三種 label position、label alignment、runtime state API、三語系 ARIA、19 組 theme、Control registry 與 dispose 還原；不得以自製 div 取代原生 input。
- `fabui.CheckGroup` 位於 `src/checkgroup/`，API 與視覺參考 jQuery EasyUI CheckGroup／Default theme；每個 data 項目必須直接建立既有 `fabui.CheckBox` 與原生 `<input type="checkbox">`，不得複製 CheckBox renderer。項目 label position 預設為 `after`，並支援 name／value／data、水平／垂直排列、itemStyle、label 設定、整組與單項 disabled、原生 FormData／reset、三語系、19 組 theme、Control registry 與 dispose 還原。
- `fabui.SwitchButton` 位於 `src/switchbutton/`，API、滑動方式與視覺參考 jQuery EasyUI SwitchButton 1.11.5；必須直接包裝原生 `<input type="checkbox">`，保留 name/value、FormData、label、鍵盤、disabled 與 reset 語意，支援 ON／OFF／handle text、尺寸、handleWidth、checked、readonly、reversed、runtime state API、三語系 ARIA、19 組 theme、Control registry 與 dispose 還原。各主題顏色、圓角與字級必須逐一對應本機 `res/themes/<theme>/switchbutton.css`，但正式 source、Demo 與 build 不得依賴 `res/`。
- `fabui.RadioButton` 位於 `src/radiobutton/`，API 與視覺參考 jQuery EasyUI RadioButton；必須保留原生 `<input type="radio">` 的 name/value、同名互斥、label、鍵盤、disabled、FormData 與 reset 語意，label position 預設為 `after`，支援尺寸、checked、三種 label position、label alignment、runtime state API、三語系 ARIA、19 組 theme、Control registry 與 dispose 還原；不得以自製 div 取代原生 input。
- `fabui.RadioGroup` 位於 `src/radiogroup/`，API 與視覺參考 jQuery EasyUI RadioGroup；每個 data 項目必須直接建立既有 `fabui.RadioButton` 與原生 `<input type="radio">`，不得複製 RadioButton renderer。項目 label position 預設為 `after`，並支援單一 name／value、data、水平／垂直排列、itemStyle、label 設定、整組與單項 disabled、原生 FormData／reset、三語系、19 組 theme、Control registry 與 dispose 還原。
- `fabui.FileBox` 位於 `src/filebox/`，API 與視覺參考 jQuery EasyUI FileBox／Default theme；必須直接組合既有 `fabui.EditBox` 與原生 `<input type="file">`，不得複製 TextBox renderer。必須保留 input 的 name、FileList、表單送出／reset、accept、multiple、capture、required 與 disabled 語意；受瀏覽器安全限制，`setValue()` 只允許空值清除，不得模擬或寫入非空本機路徑。支援三語系、19 組 theme、Control registry 與 dispose 還原。
- `fabui.Form` 位於 `src/form/`，API 參考 jQuery EasyUI Form；必須管理既有 `<form>`、原生欄位與已建立的 FabUI 控件，不得建立第二套欄位 renderer。支援 Ajax／一般 submit、queryParams、upload progress、dirty-only、本機／遠端 load、clear、reset、HTML constraint validation、enable／disable／reset validation、resetDirty、theme、Control registry 與 dispose；validation 紅框只標記實際控制框，不得把 EditBox label 一起框入，並依 `locale`／`ValidityState` 使用 `en`、`zh-TW`、`zh-CN` 訊息顯示 EasyUI 風格的箭頭提示，不得依賴瀏覽器介面語言，`setCustomValidity()` 自訂訊息則保留原文。提示必須跟隨 Form theme，開啟期間才綁定外部點擊、Escape 與 viewport listener。成功 load 與 Ajax submit 後必須更新 dirty 基準，file input 不得載入非空本機路徑。
- `fabui.Tooltip` 位於 `src/tooltip/`，API 與視覺參考 jQuery EasyUI Tooltip／Default theme；支援四方向、HTML／function content、滑鼠追蹤、顯示／隱藏延遲、viewport 翻轉、Escape、外部點擊、互斥 popup、theme、Control registry 與 dispose 還原。Tooltip 顯示期間只綁定必要的 document／window listener，隱藏或 dispose 時必須立即解除。
- `fabui.Menu` 位於 `src/menu/`，API 與視覺參考 jQuery EasyUI Menu／Default theme；支援 context／inline menu、巢狀 submenu、自訂內容、`iconCls: 'icon-xxx'`、separator、disabled、runtime item API、三語系 ARIA、鍵盤、viewport 翻轉、theme、Control registry 與 dispose 還原。Menu 必須沿用固定左側 icon 欄、icon 後分隔線與約 32px 列高；非 inline Menu 開啟期間才綁定 document／window listener，點擊外部、`Escape`、捲動或 viewport 改變時關閉，點擊 menu 內部不得誤關閉。
- `fabui.MenuButton` 位於 `src/menubutton/`，API 與視覺參考 jQuery EasyUI MenuButton／Default theme；必須直接組合既有 `fabui.Button` 與 `fabui.Menu`，不得複製 Button renderer 或 Menu popup lifecycle。支援 selector／element／既有 Menu、hover／click、`menuAlign`、`hasDownArrow`、disabled、ArrowDown／Escape、ARIA、theme、Control registry 與 dispose 還原；Button 與 Menu icon 一律使用 `iconCls: 'icon-xxx'`。MenuButton 的 icon、文字與下拉箭頭之間不得顯示分隔線；只有 SplitButton 在滑鼠移入時顯示主操作區與箭頭區的分隔線。Trigger 與 popup 的 hover 交接必須使用同一 mouse／pointer event family，移入 popup 時取消隱藏計時，不得在使用者選擇項目前誤關閉。
- `fabui.SplitButton` 位於 `src/splitbutton/`，API 與視覺參考 jQuery EasyUI SplitButton／Default theme；必須直接組合既有 `fabui.MenuButton`，主區域 click 只執行主動作，右側箭頭區 click／hover 才顯示 Menu，不得複製 Button、Menu 或 popup lifecycle。支援 `menuAlign`、`duration`、disabled、ArrowDown／Escape、ARIA、theme、Control registry 與 dispose 還原；所有 icon 一律使用 `iconCls: 'icon-xxx'`。主操作區與箭頭區的分隔線預設透明，只在滑鼠移入整個 SplitButton 時顯示。
- `fabui.Messager` 位於 `src/messager/`，API 與視覺參考 jQuery EasyUI Messager／Default theme；以 singleton 提供 `show`、`alert`、`confirm`、`prompt`、`progress`。Alert／Confirm／Prompt／Progress 必須重用 `fabui.Window`，Footer 動作必須重用 `fabui.Button`，不得另建 dialog／button renderer；Toast resize listener 只在 Toast 存在期間綁定。支援三語系、19 組 theme、Enter／Escape／focus trap、ARIA、Toast 堆疊、Progress bar handle 與集中於 `src/fabui.icon.css` 的 `icon-info`／`icon-warning`／`icon-question`／`icon-error`。
- `fabui.Tabs` 的 `draggable` 預設為 `false`，此時滑鼠位於 Tab 上必須使用一般箭頭游標；設為 `true` 時只有標題文字是 drag handle，icon、Tab 留白、tools 與關閉按鈕不得觸發拖曳，並允許 `top`／`bottom` 頁籤以滑鼠左右拖曳排序，必須保留目前選取 panel 與 DOM 對應。跟隨游標的 drag image 使用 50% 透明背景、文字與 icon，保留目前 theme 的清楚外框與陰影，原位置 Tab 保持原樣且目的地仍可透視；往左拖時在目標 Tab 左側顯示 55% 半透明垂直線並插到左方，往右拖時在目標 Tab 右側顯示垂直線並插到右方。提示不顯示箭頭、不得被 Tab 的 overflow 裁切，顏色由各 theme 的主色補色變數定義。`left`／`right` 位置不得啟用水平拖曳。
- `fabui.Tree` 位於 `src/tree/`，API 與視覺參考 jQuery EasyUI Tree／Default theme；支援 nested markup／data、展開收合、checkbox cascade、lines、`iconCls: 'icon-xxx'`、動態節點 API、右鍵事件、拖放、inline edit、filter、callback／Promise lazy loader、鍵盤、ARIA、三語系、19 組 theme、Control registry 與 dispose 還原。展開／收合、階層線、資料夾、檔案、checkbox 與 loading icon 必須使用各自 theme 的 `src/theme/<theme>/images/tree_icons.png`／`loading.gif`；hover／selected 的背景與文字色、editor 邊框及主題字級也必須逐一對應 `res/themes/<theme>/tree.css`，不得只套用共用近似色，且正式 source 不得直接依賴本機參考用 `res/`。Tree 拖放的 before／after 插入線必須使用 55% 半透明；核心不得依賴 jQuery／EasyUI。
- `fabui.PropertyGrid` 位於 `src/propertygrid/`，API 與視覺參考 jQuery EasyUI PropertyGrid／Default theme；支援兩欄 property data、`showGroup`／`groupField`／`groupFormatter(group, rows)`、自訂 columns、排序、inline editor、變更追蹤、遠端 loader、鍵盤、ARIA、三語系、19 組 theme、Control registry 與 dispose 還原。文字、數字、日期、清單與顏色 editor 必須重用 `fabui.EditBox`，不得另建重複 editor。
- `fabui.Diagram` 位於 `src/diagram/`，介面參考 DevExtreme Diagram Overview，但以 pure JavaScript SVG 自行實作且不得依賴 DevExtreme／jQuery；支援 47 種一般、流程圖、DFD 與組織圖工具箱圖形及搜尋、DFD Data Flow 二次貝茲弧線與 S Curve 三次貝茲弧線 connector 工具、置中紙張、node／connector、框選與多選、群組移動／刪除、每個圖形六個連接點拖曳連線、可拖曳 connector 與弧度控制、node／connector 雙擊就地文字編輯、拖曳、八方向縮放、格線／snap、連線模式、屬性區、zoom／fit／fullscreen、undo／redo、JSON 匯入匯出、SVG／PNG 匯出、列印、鍵盤、ARIA、三語系、19 組 theme、Control registry 與 dispose 還原。紙張小於 viewport 時必須水平與垂直置中；放大超過 viewport 時自動 margin 必須退回 0，保留正常左上起點與捲動。Connector 拖曳必須沿用 interaction 期間才綁定的 document pointer lifecycle，並以 `controlX`／`controlY` 保存控制點；直線形成折點、直角線移動中段、`curved` 改變二次貝茲曲線弧度、`sCurve` 改變三次貝茲曲線中心，且必須支援 JSON 與 undo／redo。`fitToPage()` 必須依目前 viewport 與紙張寬高縮放到整頁可見，且 Demo 初次開啟、還原範例及切換紙張後都要呼叫此元件方法，不得在 Demo 硬編固定 zoom。畫布空白處單擊必須清除圖形／連線選取，並在屬性面板以重用 `fabui.EditBox` 的欄位顯示紙張尺寸、方向與最小 5px 的吸附間距；變更後立即套用，空白處雙擊不得再開啟 modal 視窗。紙張預設 A4 橫向，支援 A3／A4／A5／Letter／Legal 與直向／橫向。公開 API 使用 `getPaper()`／`setPaper(size, orientation, gridSize?)`，`getData()`／`setData()` 與 JSON 匯入匯出必須透過 `page` 欄位保留尺寸、方向、寬高、底色及 `gridSize`；套用吸附間距後必須同步更新格線與 node／connector snap。工具箱的「一般／流程圖／DFD／組織圖」分類標題必須重用 `fabui.Button`，可各自疊合與展開並在切換語系／搜尋時保留狀態；47 種圖形預覽必須重用 Diagram SVG shape renderer，一般、流程圖與 DFD 維持空心輪廓，組織圖的人像預留區依圖形顯示在左側、右側或上方，不得以另一套 CSS 圖形取代。三種組織圖人員卡片必須保留一般 node 的拖曳、縮放、六點連線、屬性與圖形內文字編輯。DFD 提供 Entity、Process、Data Store 節點，以及 Data Flow 與 S Curve 工具；Entity、Process、Data Store 必須保留一般 node 的雙擊圖形內文字編輯；兩種連線工具都必須建立帶箭頭的 connector，不得建立成可縮放的箭頭 node。Connector 使用 `fromPoint`／`toPoint` 保存指定連接點；指定或自動端點都必須沿連線方向投影到實際圖形輪廓，不得停在外接矩形的空白區。Node 與 Connector 的就地文字輸入必須共用 `fabui.EditBox` 與相同提交／取消 lifecycle；Node 必須使用透明多行 EditBox 疊在圖形內並自動全選，不得顯示為圖形外的獨立輸入框。Diagram 內建操作按鈕必須重用 `fabui.Button`，搜尋與屬性 editor 必須重用 `fabui.EditBox`，做圖區右鍵匯出 PNG／SVG 與列印選單必須重用 `fabui.Menu` 並沿用 theme、Escape、外部點擊及 dispose lifecycle；工具箱與屬性區不得觸發此選單，不得複製 Button／EditBox／Menu renderer。
- DFD Process 必須使用圓形原型；生產製造流程 Demo 的開立製令、倉庫領料、生產工序與完工入庫都必須使用等寬高的 `dfdProcess`，不得改回一般圓角方形。
- Diagram 的 JavaScript 與 CSS 必須保持獨立發佈；一般 `build` 與 `dist/fabui.*` 不得包含 Diagram。`build diagram` 固定產生 `dist/fabui.diagram.js`、`dist/fabui.diagram.min.js`、`dist/fabui.diagram.css`、`dist/fabui.diagram.min.css`，`build diagram min` 則只產生後兩個壓縮檔。
- `fabui.Gantt` 位於 `src/gantt/`，以 pure JavaScript TreeList＋Timeline 重新設計 Kendo UI Gantt 的資訊架構，不得依賴或複製 Kendo／jQuery runtime。支援階層 Task、可調 Splitter、day／week／month／year View、進度、摘要、里程碑、FS／FF／SS／SF 相依線、選取、鍵盤、Task bar 拖曳／開始與結束縮放／進度調整、三語系、19 組 theme、Control registry 與 dispose。Task editor 與 toolbar 必須重用 `fabui.Window`、`fabui.EditBox`、`fabui.Button`。Gantt source、CSS 與 browser global 保持獨立；build 產生四個 `dist/fabui.gantt.*`，`dist/fabui.*` 不得包含 Gantt。Browser global 必須先載入 `fabui.*` 再載入 `fabui.gantt.*`，反向載入要拋出明確 dependency error。
- Diagram node 公開 `hyperlink` 與 `hyperlinkTrigger: 'click' | 'dblclick'`；選取 node 後，屬性區必須在「文字」正下方顯示重用 `fabui.EditBox` 的三語系「超連結」欄位，下一列以 Combo 顯示「單擊觸發／雙擊觸發」，預設為 `click`，並由既有 property lifecycle 保存 JSON 及支援 undo／redo。有效連結文字必須顯示底線與手形指標，且只有符合 `hyperlinkTrigger` 的單擊或雙擊才能觸發；圖形不必預先選取，第一次直接點文字就必須觸發，不得要求先選圖形再點文字。HTTP／HTTPS、mailto、tel、相對網址與頁內錨點使用 `window.open(url, '_blank', 'noopener,noreferrer')` 開啟，`javascript:` 則以 `window.location.href` 在目前 Diagram 頁面執行，兩者都必須觸發 `HyperlinkClick`。觸發超連結的單擊／雙擊不得進入文字編輯模式；圖形內文字以外區域仍可雙擊編輯。未指定協定時補上 HTTPS，其他協定不得啟用；`javascript:` 可執行任意頁面程式，只能使用可信任的 Diagram JSON 與超連結內容。
- Diagram 的刪除、復原／重做、方向鍵移動與 Escape 等全域鍵盤捷徑，只能在事件焦點不位於屬性 EditBox、工具箱搜尋、就地文字編輯或其他 input／textarea／select／button／link／contenteditable 互動控件時執行；互動控件必須保留 Backspace、Delete、方向鍵與組合鍵的原生行為，不得因此刪除或移動圖形／連線。
- Diagram 在可編輯模式下點選 SVG 圖形、連線或畫布時必須將焦點留在 Diagram host，讓選取後直接按 `Delete`／`Backspace`、方向鍵或復原／重做快捷鍵即可操作，不得要求使用者再點外框；進入屬性或就地 EditBox 後仍由互動控件取得焦點並保留原生按鍵。
- Diagram 繪圖 viewport 必須以非 passive `wheel` listener 支援滾輪縮放：向上放大、向下縮小，以滑鼠所在位置為縮放錨點並限制於 `minZoom`／`maxZoom`；只攔截 viewport 的垂直滾輪，工具箱與屬性區仍維持一般捲動，唯讀模式仍可使用縮放。
- Diagram connector 公開 `arrowDirection: 'none' | 'end' | 'start' | 'both'`，預設為 `end`；選取線條後，屬性區必須以共用 `fabui.EditBox` Combo 提供三語系選項，SVG 使用 `marker-start`／`marker-end` 呈現，並透過既有 property change lifecycle 保存 JSON 與支援 undo／redo。
- Diagram 工具列連線模式必須讓 viewport 與其中內容顯示十字指標，並優先攔截 node 的 move／resize；使用者可從起點圖形內任意位置拖曳到另一個圖形內任意位置，放開後建立未指定 `fromPoint`／`toPoint` 的 connector，讓元件依兩圖形位置自動選擇最佳端點。空白處、同一圖形或 pointer cancel 不得新增連線。
- Diagram 上方工具列必須提供重用 `fabui.Button` 的「工具箱」toggle；pressed 狀態與 `options.toolbox` 同步。關閉工具箱時必須同時隱藏 toolbox splitter 並讓 viewport 接手空間，重新開啟時保留既有寬度與各分類展開／疊合狀態。
- Diagram 工具箱的每個分類標題右側必須提供重用 `fabui.Button` 與 `icon-drag-vertical` 的專用拖曳把手；只有從把手開始的上下拖曳可調整 `toolboxOrder`，分類標題仍只控制展開／疊合。插入提示使用 55% 半透明線；有效的 `toolboxStateKey` 必須將分類順序與 `_toolboxCollapsed` 一起保存，並相容舊版只有分類布林值的儲存內容。
- Diagram 工具箱最上方 pane header 必須作為整個工具箱的拖曳把手：從停靠狀態往工作區拖曳時改為浮動面板，浮動時可在工作區範圍內移動，拖至左側或右側停靠提示區並放開時重新 dock；若目標側已有屬性面板，兩者必須依 `sameSideDockMode` 使用下方標籤的共用 Tabs，或工具箱在上、屬性在下的同側上下排列，不得改變屬性面板的停靠側。停靠時內側 6px 透明邊緣可調寬，該側必須顯示 1px 面板框線；浮動時左右兩側的 6px 透明邊緣可調寬，上下兩側的 6px 透明邊緣可調高，並維持完整外框，不得顯示額外 splitter 色帶。Document pointer listener 只在面板拖曳或調整尺寸期間綁定，pointer up、pointer cancel 或 dispose 時立即解除，pointer cancel 必須還原開始前的停靠／浮動狀態、停靠側、位置、寬度與高度。分類標題右側 icon 的上下排序行為不得被整體面板拖曳取代。
- Diagram 屬性 pane header 必須作為整個屬性面板的拖曳把手：從停靠狀態往工作區拖曳時改為浮動面板，浮動時可在工作區範圍內移動，拖至左側或右側停靠提示區並放開時重新 dock；若目標側已有工具箱，兩者必須依 `sameSideDockMode` 使用下方標籤的共用 Tabs，或工具箱在上、屬性在下的同側上下排列，不得改變工具箱的停靠側。停靠時內側 6px 透明邊緣可調寬，浮動時左右兩側可調寬、上下兩側可調高；面板內 EditBox 與其他屬性操作不得觸發整體拖曳。Document pointer listener 只在面板拖曳或調整尺寸期間綁定，pointer up、pointer cancel 或 dispose 時立即解除，pointer cancel 必須還原開始前的停靠／浮動狀態、停靠側、位置、寬度與高度。
- Diagram 工具箱與屬性面板同時浮動時，點擊任一面板的標題、內容、控件或尺寸調整邊緣，必須將該面板與所有 resizer 一起提到另一面板上方；切換層級不得改變浮動位置、尺寸或觸發拖曳。
- Diagram `toolboxStateKey` 必須以相容舊版分類布林值與 `order` 的格式，同時保存完整做圖進度，以及工具箱／屬性面板的顯示、浮動、左右停靠側、浮動位置、各自寬度與高度；做圖進度使用 `diagram: getData()` 保存紙張、nodes、connectors，新增、修改、移動、縮放、刪除、清除、`setData()`／JSON 載入、undo 與 redo 後立即更新，下一次建立相同 key 時必須優先於 options 初始資料自動載入。舊版沒有 `diagram` 的內容仍須相容。工具列開關、任一面板尺寸調整、浮動移動、重新停靠、切換同側排列模式或 tab 完成後也要立即更新，重新載入時完整恢復。兩個 docked 面板可以同在左側或右側；`sameSideDockMode: 'tabs'` 必須重用 `fabui.Tabs`，工具箱／屬性標籤固定顯示於下方，只顯示作用中面板；`sameSideDockMode: 'stacked'` 必須在單一側欄讓工具箱置於上方、屬性置於下方並同時顯示。排列模式、作用中 tab，以及紙張尺寸、方向、寬高、底色與 `gridSize` 都必須保存；紙張設定套用或載入含 `page` 的 JSON 後立即更新記憶。
- Diagram 紙張放大超過 viewport 可視範圍後，左鍵從沒有 node、connector 或控制點的空白處拖曳必須以 `scrollLeft`／`scrollTop` 平移做圖區，並顯示 grab／grabbing 游標；pointer listener 只在拖曳期間綁定，`pointercancel` 必須還原起始捲動位置。紙張未超出範圍時仍保留原本 marquee；超出時按住 `Shift`／`Ctrl`／`Cmd` 拖曳也必須改為 marquee，點到圖形、線條與控制點的既有操作不得改變。
- Diagram 拖曳單一或多個 node 時，若未自訂控制點的相連 orthogonal connector 端點只差少量距離即可成為水平或垂直直線，必須在格線吸附後微調整組 node 位置完成對齊；門檻為 `gridSize * 0.75` 並限制在 5 至 16px。兩端都在移動、超過門檻、非 orthogonal 或已有 `controlX`／`controlY` 的 connector 不得套用此自動對齊。
- Diagram node 屬性面板的 `X`／`Y` 必須並排於同一列，`width`／`height` 必須並排於下一列；每個欄位仍使用獨立 `fabui.EditBox`，不得合併資料寫回或改變既有 property undo／redo lifecycle。
- Diagram `print()` 必須使用目前頁面的隱藏 iframe 列印紙張 SVG，不得以 `window.open()` 開啟新分頁或新視窗；列印專用 SVG 副本必須移除 grid pattern 並將 page fill 還原為目前 `pageColor`，不得改變做圖區或 SVG／PNG 匯出的網格契約。列印文件的 `@page size` 必須同時使用目前 `paperSize` 與 `paperOrientation`，讓列印預覽方向與做圖紙張一致。`@page` 實體 margin 必須為 0，以預設排除瀏覽器 header／footer，原本 12mm 留白改由 border-box body padding 提供。SVG 必須以 `!important` 覆蓋匯出內容的固定 inline 寬高，同時限制在可列印寬度與高度內、保持比例置中且不得產生空白第二頁；列印完成後必須移除暫存 iframe。
- Diagram 必須提供兩種不同的全螢幕：右下角檢視工具列以 `icon-fullscreen` 的 icon-only Button 執行 `toggleFullscreen()`，以完整 Diagram host 為 target，包含主工具列、工具箱、屬性區、做圖 viewport 與下方檢視工具列；做圖區右鍵 `fabui.Menu` 必須顯示「投影片展示／離開投影片展示」，其 `togglePresentationFullscreen()` 只以 viewport 為 target，不包含其他編輯介面。兩種模式都要在 fullscreen layout 生效後以 24px 留白重新 `fitToPage()`，並只在全螢幕期間以 `ResizeObserver` 跟隨最終 viewport 尺寸；observer 必須比較 viewport border box，手動縮放造成的捲軸或 content box 變化不得重新執行 `fitToPage()`、限制使用者在 `minZoom` 至 `maxZoom` 間縮放。離開後立即解除 observer 並還原原本 zoom 與 scroll。右鍵選單必須在兩種 fullscreen top layer 內保持可見與可操作。
- Diagram 工具箱分類的疊合／展開箭頭固定使用清楚的 20px 尺寸；預設只展開第一個「一般」分類，其餘分類疊合，並可用 `toolboxStateKey` 將最後分類狀態安全保存至 `localStorage`。工具箱預設／最小／最大寬度為 260／140／420px，屬性面板為 230／180／420px；浮動高度預設／最小／最大值皆為 520／180／720px。左右透明邊緣支援 pointer 拖曳與左右方向鍵，上下透明邊緣只在浮動時顯示並支援 pointer 拖曳與上下方向鍵。Document pointer listener 只在實際拖曳期間綁定，pointer up、pointer cancel 或 dispose 時立即解除；pointer cancel 必須還原拖曳前寬度、高度與浮動位置。
- Diagram 上方工具列必須提供三語系「清除頁面」，使用既有 `icon-clear` 與 `fabui.Button`；`clearPage()` 只清除所有 node／connector，保留紙張尺寸、方向與底色，空白頁面時停用，且必須寫入既有 history 以支援 undo／redo。
- Diagram 上方工具列必須提供三語系「唯讀」toggle，呼叫 `setReadOnly()` 控制作圖區並同步 pressed 狀態；狀態改變時觸發 `ReadOnlyChanged`。唯讀時主工具列必須維持可見以便解除唯讀；復原、重做、刪除、清除、載入、連線、工具箱與屬性等編輯操作停用，工具箱與屬性區隱藏，但縮放、符合、格線、全螢幕、下載、右鍵匯出與投影片展示等檢視操作保留。
- Diagram 上方工具列必須提供三語系「下載／載入」FabUI Button；下載使用既有 `export('fabui-diagram.json')` 保存包含 `page`、nodes 與 connectors 的完整 JSON，載入使用隱藏且只接受 `.json`／`application/json` 的原生 file input，讀取後必須透過既有 `import()`／`setData()`，不得建立另一套資料轉換。有效檔案完成後觸發 `JsonLoaded` 並 `fitToPage()`；讀取失敗或 JSON 無效時觸發 `LoadError` 且不得改變目前圖面；FileReader callback 在 dispose 後不得再操作元件。
- Diagram 上方工具列與做圖區右鍵選單都必須提供三語系「匯出 PNG」、「匯出 SVG」與「列印」；兩處直接共用既有 `exportPng()`、`exportSvg()` 與 `print()`，右鍵功能必須保留。上方工具列由左至右固定分為「下載／載入」、「匯出 PNG／匯出 SVG／列印」、「復原／重做／刪除／清除頁面」、「直線／直角線／弧線／S 線／連線」、「工具箱／屬性／唯讀」五組，組間使用垂直分隔線；「連線」右側必須保留分隔線。四顆連線類型按鈕必須是重用 `fabui.Button` 的 icon-only toggle，使用 `src/fabui.icon.css` 圖示與三語系 title／ARIA；圖示只能呈現線型，不得包含箭頭。四者互斥顯示目前 `_connectType`，預設選取直角線；類型按鈕只切換連線類型，文字「連線」按鈕獨立開關連線模式。實際 connector 的 `arrowDirection` 預設仍為 `end`，由左向右連接時顯示向右箭頭。
- Diagram 右下角檢視工具列必須可從縮放百分比或空白處拖曳，並限制在 Diagram host 範圍內；「投影片展示」與「全螢幕」必須是相鄰的 icon-only `fabui.Button`，分別使用 `icon-projector-screen` 與 `icon-fullscreen`。Projector screen 圖像以 `res/projector-screen.png` 為來源並納入正式 source 資產，正式 source／build 不得依賴 `res/`。兩顆按鈕的 tooltip 與 ARIA 必須依目前狀態顯示進入／離開文字；投影片展示與做圖區右鍵選單共用 `togglePresentationFullscreen()`，右鍵選單仍保留文字。檢視工具列「符合內容」文字縮短為三語系「符合／Fit／适合」。按鈕不得觸發拖曳。Document pointer listener 只在拖曳期間綁定，pointer up、pointer cancel 或 dispose 時立即解除，pointer cancel 必須還原拖曳前位置。有效的 `toolboxStateKey` 必須與既有版面狀態一起保存檢視工具列左／上座標，重新載入時還原，並相容於舊版儲存內容。
- Diagram node／connector 的就地文字 EditBox 定位必須同時納入目前 zoom、viewport scroll 與 SVG 因整頁置中產生的實際 offset；任何縮放比例都必須準確疊在圖形或連線標籤上，不得只以 SVG 內座標換算。
- Diagram connector 的非空 `text` 必須顯示在線條中點上方，不得讓線條穿過文字；renderer 必須在文字後方插入使用目前 `pageColor` 的 SVG 背景遮罩，讓 connector 從標籤下方清楚接續。遮罩不得攔截 pointer，也不得改變 connector 路徑、控制點、JSON 或既有雙擊就地編輯 lifecycle。
- Diagram node／connector 屬性面板必須提供共用的 `fontSize`（8～96）Number EditBox，以及重用 `fabui.Button` 的 `fontBold`、`fontItalic`、`fontUnderline`、`fontStrikethrough` toggle；格式必須立即套用於 SVG 與就地文字 editor、保存於 JSON，並沿用既有 undo／redo。超連結 node 的必要底線必須能與刪除線組合，不得互相覆蓋。
- Diagram 同時選取兩個以上 node 時，必須顯示包含全部選取圖形的共用虛線外框與四個角落縮放控制點；拖曳控制點以群組中心固定並使用單一比例同步縮放每個 node 的 `x`／`y`／`width`／`height`，讓圖形尺寸、中心距離與彼此空白間距一起縮放。整組內具有 `controlX`／`controlY` 的 connector 控制點也要繞同一中心縮放；單次操作只提交一筆 history，pointer cancel 必須還原所有 node 與 connector。多選屬性面板必須提供 `fontSize`、粗體、斜體、底線、刪除線、`width`、`height`、`fill` 與 `stroke` 批次調整；不同值以混合狀態顯示，修改後一次套用全部選取 node 並提交單筆 history。多選不得顯示會覆寫不同內容或造成重疊的 `text`、超連結、`x`、`y` 欄位。
- Diagram connector 未指定 `fromPoint`／`toPoint` 時，必須在每次重繪依兩個圖形目前位置評分自動邊中點，兼顧距離與端點朝向；直角線第一段與最後一段必須符合所選邊的 outward direction，圖形拖曳後自動重選。明確指定的六點連接位置仍須保持，不得被自動選點覆寫。
- 未來發佈任何 standalone 控件時，必須建立獨立 entry、CSS、demo、API 文件與驗證；不得併回 FabGrid core bundle。
- 核心使用不綁定框架的 pure JavaScript。
- 第一版 demo 不需要後端。
- core package 不依賴 Vue。
- 資料來源選項 `remote` 預設為 `false`；`remote: true` 已支援 GET／POST、Promise loader、遠端分頁、排序、全域搜尋與欄位篩選。
- core 必須能打包成可在其他專案引用的 library 檔案。
- 發佈主檔固定為 `fabui.js`、`fabui.min.js`、`fabui.css`、`fabui.min.css`，不得包含 Diagram，並輸出 `dist/theme/fabui.<theme>.css`、`dist/theme/fabui.<theme>.min.css` 與圖片依賴；`dist/` 不得產生以 `fabgrid.*` 命名的樣式檔。
- Diagram 發佈檔固定為 `fabui.diagram.js`、`fabui.diagram.min.js`、`fabui.diagram.css`、`fabui.diagram.min.css`，不得併入 `dist/fabui.*`。
- 精簡發佈檔固定為 `fabui.lite.js`、`fabui.lite.min.js`、`fabui.lite.css`、`fabui.lite.min.css`；只公開 FabGrid（必須包含 `src/grid/fabgrid-tree.js` 的 TreeGrid 行為）、Chart、`fabui.pivot` 與必要的 Control、editor definitions、locale、theme、popup 依賴，不得納入其他 FabUI 控件 factory 或元件 CSS。`npm run build:lite` 只更新這四個 Lite 檔與其必要圖片，不得清除完整 `dist/fabui.*`。
- `dist/fabui.min.js` 必須是可用 `<script>` 直接引用的 browser global 壓縮版本。
- Vue 2 與 FabGrid jQuery wrapper 目前暫緩開發，不列入預設 build、smoke 或發佈輸出；以下 wrapper 條目保留作為既有實作與未來恢復時的技術契約。
- Vue 2 Options API wrapper 位於 `packages/fabgrid-vue`，只負責把 props、events、lifecycle 對應到 pure JS core。
- Vue wrapper 使用 `fabgrid-vue` 獨立 build，不可併入 FabUI 主 bundle，也不可讓 Vue 接管 cell rendering。
- jQuery wrapper 位於 `packages/fabgrid-jquery`，使用 `$.fn.fabgrid` 對應 core options、events、methods 與 lifecycle；不得複製 core 行為或讓 jQuery 接管 cell rendering。
- jQuery wrapper 使用獨立 build，不可併入 FabUI 主 bundle；browser bundle 依賴全域 `jQuery` 與 `fabui`。
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
- 所有公開 FabGrid 事件都必須支援 constructor option callback，簽名為 `(grid, eventArgs)`，包含 `selectionChanged` 與 `updatedView`；constructor 建立 Wijmo-compatible event objects 後必須逐一綁定對應 option function。既有 event object 與 native emitter API 必須保持相容。
- 1 至 3 階列群組、aggregate、群組收合狀態與 Excel 群組匯出。
- `childItemsPath` TreeGrid、節點收合／展開、同層排序、篩選祖先路徑、收合／篩選後維持原始列號與階層鍵盤導覽。樹欄所有資料 cell 右鍵都必須顯示單一「全部展開／全部疊合」狀態項目；仍有可視展開節點時顯示全部疊合，全部疊合後交換為全部展開，並由 TreeGrid class 共用既有 Grid popup 容器與關閉規則，不得只實作在 Demo。
- `allowDragging: 'Rows'` 的本機資料列拖曳、跨 Grid move、TreeGrid `before`／`inside`／`after` 節點重排與上下階；循環階層必須被拒絕。欄位拖曳、資料列 `before`／`after`／`inside` 與 PivotPanel 欄位拖曳的插入指示線統一使用 55% 半透明，不得顯示不透明實線；Grid／TreeGrid 資料列插入指示線的右邊界不得超過實際欄位區域或延伸到垂直捲軸。
- 左上角列頭 cell 右鍵功能表，在兩種模式都可用時提供目前篩選模式切換，另提供清除所有篩選、「列號」下層顯示模式、Excel／CSV 匯出與 Grid fullscreen。
- `selectionMode` 支援 `Cell` 與連續矩形 `CellRange`；後者支援滑鼠拖曳、`Shift + Click`、`Shift + 方向鍵`與 TSV clipboard copy。CellRange 雙擊必須由同一資料格的連續 pointer 操作成立，`pointercancel` 不得觸發雙擊，完成 pointer 選取後不得再由 click 重複套用 selection 或 render。`highlightActiveRow` 預設為 `true`，只控制 active row 背景，不得隱含改變多選列；active cell 邊框預設為 2px，`setRowHeaderWidth(width)` 可在 runtime 調整列號欄寬並自動 refresh。
- `select(row, col?)` 維持 active cell API，不得改成 `selectRow` 別名；省略 `col` 時預設為第一個可見欄 index `0`。不論是否傳入 `col`，若目標 row 未完整顯示，必須自動捲動，並盡量將該 row 對齊 Grid 可視區第一列。
- FabGrid 全域 `columnMinWidth` 預設為 `20px`，用於 Column 未指定 `minWidth` 時的最小欄寬；初始欄寬、滑鼠拖曳調寬與 `autoSizeColumn()` 必須共用這個下限，個別 Column 明確設定的 `minWidth` 仍優先。
- 頁面使用 Default theme 時只載入 `fabui.css`／`fabui.min.css` 或對應 Lite CSS；使用其他 theme 時，必須再於所有 FabUI／附加元件 CSS 後載入一份 `dist/theme/fabui.<theme>.css` 或 `.min.css`。Theme 由頁面載入的 CSS 決定，不從檔名設定元件 class，也不需要呼叫 `setTheme()`；切換 theme 必須更換 CSS 後重新載入頁面。
- `unselectRow(row)` 用於 `multiSelectRows: true` 取消勾選指定列；若該列未勾選必須不做任何修改，不得如 `toggleRowSelection()` 反向勾選。
- `alternatingRowStep` 預設為 `1`；`false` 關閉交替列背景，正整數依指定列數為一組切換交替色。
- `formatItem.addHandler((g, e) => {})` 使用 `fabui.CellType` 數值列舉與相容 panel；Header、Footer、Data Cell、Row Header 的事件參數必須由單一共用流程建立，不得在各 renderer 重複定義。
- Column `cellTemplate` 使用 Wijmo-compatible `string | function | null` 契約；函式簽名為 `(ctx, cell)`，context 包含 `col`、`row`、`item`、`value`、`text`，回傳 HTML 字串或直接修改 cell 並回傳 `null`。Template 只影響 body cell 顯示，不得改變 editor、clipboard 或 export 的原始資料契約。Function callback 執行前後必須合併 cell inline style：`cell.style = customStyle` 只疊加自訂視覺樣式並保護 Grid 定位／尺寸，`cell.style = null` 還原 callback 前的 Grid 樣式。
- `setHeaderCellStyle(binding, style)` 必須只以欄位實際 `binding` 設定 Header cell 樣式；保留 Grid 原本與 `formatItem` 套用的樣式，同名 CSS property 由傳入 style object 覆蓋。設定必須保存副本並於 Header 重繪後持續生效，傳入 `null` 清除，無效 binding 或 style 回傳 `false`。
- `g.rows` 與 `selectedRows` 回傳 `fabui.FabGrid.Row`／`fabui.FabGrid.GroupRow` instance；`GroupRow` 繼承 `Row`，群組 header 與 group footer 都必須是 `GroupRow`；不得另外公開 `fabui.grid` namespace。
- `fabui.Control.getControl(elementOrSelector)` 由 host element registry 取得 FabGrid instance；FabGrid 建立時登記、`dispose()` 時解除，找不到時回傳 `null`。
- FabGrid 繼承 `fabui.Control` 的 `addEventListener()`／`removeEventListener()`；managed DOM listeners 必須在 `dispose()` 自動解除。欄位拖曳、欄寬調整、CellRange、捲軸與資料列拖曳所需的 document pointer listener 必須只在互動期間綁定，結束、取消或 dispose 時立即解除，不得讓每個 Grid 常駐全域 pointermove／pointerup listener。`hitTest()` 使用 `fabui.CellType` 與 panel 區分資料 cell、Header、Search Row、列頭與 Footer；Search Row 屬於 `ColumnHeader` 並提供 `isSearchRow: true`。
- 欄位拖曳、欄寬調整、雙擊 header 分隔線 AutoFit、欄位顯示切換、footer aggregate。
- CSV 與 Excel 匯出，以及 Excel hidden columns、格式、凍結窗格與 autoFilter。
- JSON API 使用 `getJson(options)`、`exportJson(filename, options)` 與 `importJson(source)`；預設匯出完整 `itemsSource` 以保留 TreeGrid 階層，只有 `viewOnly === true` 才匯出排除合成群組列的目前 view。
- `text`、`number`、`time`、`date`、`combo`、`color` grid editor；`time` 共用 EditBox definition、遮罩、24 小時驗證與可選 Spinner，`color` 支援 hex 與標準 CSS 顏色名稱，名稱提交後保留原文字；`fabui.EditBox` 由 core bundle 公開。
- 欄位搜尋列遇到 `date`、`combo`、`color` editor 時沿用對應下拉 panel；搜尋輸入只建立 filter，不執行 cell validation。
- Header 漏斗採互斥的兩套欄位篩選，統一由 `filterMode: false | Array<'excel' | 'searchRow'>` 控制；陣列第一項是預設及目前模式，正規化後 `array.length > 1` 時 Header 右鍵功能表才提供篩選方式切換，單一項目只開放該模式且不得顯示切換項目，`false`／空陣列關閉兩者。每次切換目前模式先清除另一套欄位條件，右下角 Quick Search 保留。`showSearchRow` 已移除，不得重新加入；`allowFiltering` 僅保留為舊版相容入口，新程式必須使用 `filterMode`。
- Filterable Header 文字必須垂直置中，漏斗 icon 疊在右上方；文字與數字欄位寬度不足時都必須可延伸並重疊顯示在 icon 下方。右對齊數字 Header 採三段式間距：欄寬足以容納完整標題與 filter icon 時必須保留 `24px` icon 空間且不得重疊；稍窄但完整標題仍放得下時，右側保留與左對齊文字 Header 左側相同的 `6px` 間距並允許重疊；再窄時才取消該間距。右對齊 Header 的 sort icon 必須使用絕對定位，不得因切換排序而改變文字位置；其他窄欄位判定仍須預先計入 sort icon 寬度。漏斗圖形在 hit area 內的左側內距為 `2px`；Default 與其他淺色主題切換為運算符 icon 後必須使用一般字重的 `blue`，`black` 與 `dark-hive` 深色主題改用白色，不得加粗或沿用過淺的漏斗色。icon 必須維持獨立且高於文字的 hit area，點擊只開啟篩選選單，不得觸發排序或欄位拖曳；Header 右邊界的 resize handle 必須高於 filter icon，確保拖曳調寬與雙擊 AutoFit 可用。
- Header sort 符號下緣必須與文字行框下緣對齊；一般欄位或關閉 filtering 時維持緊鄰欄位文字，窄欄位同時顯示 sort 與 filter icon 時，sort icon 必須移到 filter funnel 左側並維持 `2px` 可視間距，文字不為兩個 icon 預留右側空間並允許在其下方重疊。多欄排序序號維持顯示於符號上方。
- `filterMode` 是 Search Row 與 Excel-like 欄位篩選的唯一狀態來源；預設為 `['excel', 'searchRow']`，陣列第一項為目前模式，重複項目移除、未知項目忽略，全部無效等同 `false`。切換為 `false` 時必須隱藏兩套欄位篩選 UI、清除兩套欄位條件，但保留右下角 Quick Search。FabGrid constructor 的 `filterRules` 接受 `{ field, op, value }[]` 或 JSON 字串；只有 `filterMode` 包含 `'searchRow'` 時才處理，有效且對應 Grid column 的規則必須在第一次本機 view／遠端 request 前轉成 Search Row 狀態，將 `'searchRow'` 移到陣列第一項、填入 input 並顯示 operator 符號，不得要求使用者再逐欄呼叫 setter。FabGrid 初始化時若 Search Row 已啟用，必須在本機初次 render 或遠端初次 load 結束後聚焦第一個可見欄位的搜尋 input；後續 Header 重繪必須保存目前搜尋 input 的焦點與游標範圍。只有 Search Row 顯示時才套用資料列與搜尋列的方向鍵焦點切換：Search input 聚焦時，無 modifier 的 `ArrowDown` 必須將 active cell 切到目前 selected row 與 Search input 所屬的同一 column，但不得移動 selected row 或啟動 cell editor；若目前 active cell／selected row 已被捲出可視範圍，必須先捲動使其出現。input 隨即失焦並把焦點轉到 Grid，下一次方向鍵才開始 Grid 導航。active cell 位於第一列時，無 modifier 的 `ArrowUp` 必須將焦點交回同一 column 的 Search input。Search input 聚焦時的 `ArrowUp` 保留 input 焦點與既有向上選取行為。已開啟的 Date／Combo／Color popup 優先處理方向鍵。
- Search Row input 的 `searchDelay` debounce 預設為 `400ms`，本機與 `remote: true` 共用；每次 input 必須取消前一次 timer 並重新計時，設為 `0` 時才可立即套用。
- Search Row input 按 `Enter`／`Tab` 必須移到下一個可見欄位的搜尋 input，`Shift+Enter`／`Shift+Tab` 必須移到上一個；目標 input 已有內容時必須全選，空白時維持一般游標。四者都要阻止外層表單預設提交，但不得取消既有 debounce timer、立即套用篩選或送出 `remote: true` 查詢。輸入內容仍只依 `searchDelay` 套用；到達第一個或最後一個可見欄位時維持目前 input。
- Constructor 收到 `filterRules` 時不得覆寫使用者明確指定的 `filterMode`；若 Search Row 不在可用模式內就忽略規則。遠端 POST 必須將規則 JSON 字串放入 Form Data 的 `filterRules` 欄位，沒有對應顯示 column 的伺服器規則也必須保留。
- Grid 建立後的 `setFilterRules(rules)` 必須一次取代舊規則、同步 Search Row input 與 operator，並自動觸發一次篩選更新；`remote: true` 必須將已知標準 operator 轉成相容符號送出、保留無對應符號的自訂 `op` 原字串、將頁碼重設為第 1 頁，並只重新送出一次 request。傳入空陣列必須清除 runtime rules 與 Search Row 值。
- `getFilterRules()` 必須回傳目前實際生效、下一次會送給後端的 rules 陣列，包含 Search Row 最新 input 值與未對應顯示 column 的伺服器規則；沒有有效規則時必須回傳 `[]`。必須回傳深層副本，外部修改不得影響 Grid。
- `remote: true` 的 constructor `filterRules` 不得拒絕使用者傳入的 `op`；自訂大小寫與符號必須保留供後端處理，本機模式仍只接受 FabGrid 支援的 operator。對應到 Grid column 的相容 `op` 即使 `value` 是空字串，也必須初始化 Search Row operator 與 filter icon；空白 Search input 一律不產生該欄位的篩選規則、不送到後端，輸入內容後才送出，清空後停止篩選。
- `remote: true` 的 Search Row UI 使用既有標準 operator，但 `getFilterRules()` 與 GET／POST request 必須一律送出相容符號：`starts` → `..%`、`contains` → `%..%`、`ends` → `%..`、`not-starts` → `!..%`、`not-contains` → `!%..%`、`not-ends` → `!%..`、`gte` → `>=`、`gt` → `>`、`lte` → `<=`、`lt` → `<`、`ne` → `<>`、`eq` → `=`。傳入相容符號時維持相同符號；沒有對應符號的自訂 `op` 仍原樣送出。`options.filterRules` 可保留輸入格式，但不得讓標準名稱出現在實際 request。
- `remote: true` 送出不分大小寫的 `op: "in"` 時，Search Row 必須顯示 `IN`，`value` 必須是逗號分隔字串而不是 JSON 陣列；例如 `value: ["ZU001", "AV001"]` 必須在 `options.filterRules`、`getFilterRules()` 與 GET／POST request 中正規化為 `value: "ZU001,AV001"`，並保留輸入的 `op` 大小寫。Excel-like filter 的內部選取狀態仍保留陣列。
- Excel-like 篩選 popup 開啟時按 `Escape` 必須只關閉 popup，不可套用或清除尚未提交的篩選草稿。
- `remote: true` 套用 Excel-like 值篩選後重新開啟同一欄位時，Popup 必須保留套用前的完整候選值集合，只以目前 filter values 決定勾選狀態；不得因遠端回傳已篩選資料而移除未勾選候選值。
- 左上角欄位選擇器 popup 必須支援按 `Escape` 與點擊 popup 外部關閉；點擊 popup 內部或觸發按鈕不得誤關閉。
- 一般 Grid popup 由欄位 Header Row 的右鍵操作開啟，不再由左上角列頭 cell 開啟；Search Row 與一般資料列不觸發此 popup。TreeGrid 樹欄資料 cell 例外，使用同一 popup 容器顯示 TreeGrid 全部展開／全部疊合項目。
- `en`、`zh-TW`、`zh-CN` locale 與多組 theme。
- Pivot 類別與列舉只由 `fabui.pivot` namespace 公開，包含 `PivotEngine`、`PivotField`、`PivotPanel`、`PivotGrid`、`PivotChart`、`PivotWorkspace`、`PivotSlicer`、`PivotAggregate`、`PivotShowAs` 與 `PivotShowTotals`；不得在 `fabui` 頂層重複公開。PivotEngine 支援本機 Array、多階 row／column fields、value／filter fields、Sum／Count／Average／WeightedAverage／Min／Max、calculated field、小計／總計、日期 groupBy、ShowAs、viewDefinition 與 detail keys。同步 `refresh()` 必須保持相容；`refreshAsync({ batchSize })` 分批處理並回報 `progress`，`cancelRefresh()` 或新的非同步工作取消舊工作時不得以部分結果取代既有 `pivotView`。Average 只計入有效數值；Date filter 經 JSON 序列化後仍依日期值比對；`setFields()` 必須依穩定 field key 將四個 View 區域重綁到新的 PivotField instance。
- PivotPanel 沿用 FabGrid theme variables，提供 Fields／Filters／Rows／Columns／Values 區域、欄位勾選與滑鼠／觸控拖放、排序、filter field 多值草稿配置、Rows／Columns 欄位右鍵預設／升冪／降冪排序 popup、數值欄位右鍵 aggregate／ShowAs 設定及 JSON 字串 viewDefinition；所有 popup 必須沿用既有左側 icon 欄、分隔線、緊湊列高、hover／active 與 `Escape`／點擊外部關閉規則。Filters chip 只顯示欄位名稱與操作；內容可由該 chip 的多值篩選 dialog、PivotGrid 左上角或共用同一 Engine 的 PivotSlicer 設定。未按「套用」的 filter 草稿不得寫入 PivotField。Values chip 必須優先清楚顯示欄位名稱，不得放置會壓縮名稱的 inline aggregate select。Filters、Rows、Columns、Values 都不顯示上下移動按鈕，統一以拖曳排序並以插入橫線提示實際落點。Panel、Grid、Chart 與 Slicer 必須共用同一個 PivotEngine，不得在 Demo 複製彙總邏輯。
- PivotGrid 繼承 FabGrid，固定為唯讀並重用雙向 virtualization、CellRange、clipboard、匯出、Control lifecycle、Grid fullscreen、popup 規則與 theme variables；支援多層欄標頭、固定 row fields、列／欄 subtotal 展開收合、dimension 預設／升冪／降冪三態排序、Pivot 右鍵選單及雙擊明細。Row field 右鍵選單必須以單一「全部展開／全部疊合」狀態項目操作所有列與欄群組，不得顯示單一「展開群組／疊合群組」項目；所有 PivotGrid 右鍵 popup 點擊外部必須立即關閉，點擊 popup 內部不得先關閉而阻斷項目操作，並維持 `Escape` 關閉；Header Cell 右鍵選單必須提供進入／離開 PivotGrid 全螢幕，資料 Cell 選單維持原有功能。列欄位 Header 排序必須依「預設 → 升冪 → 降冪 → 預設」循環，預設狀態保留原始出現順序且不顯示排序符號，從 Grid 變更排序或 aggregate 時必須觸發 `viewDefinitionChanged`。重複的父層 row field 值必須疊合為跨越明細與小計列的單一 cell，展開／收合按鈕放在父層值旁，收合後只保留該群組的小計列。Pivot view 更新、排序或疊合後必須依 row key 與 data-column key 保留邏輯選取，原資料不可見時才 clamp。PivotGrid 預設 Excel 匯出必須保留疊合子欄與明細列資料，並在工作表分別維持 hidden column／hidden row；只有 `visibleOnly === true` 才排除目前不可見欄位，疊合列明細仍須保留為 hidden row。PivotPanel Filters 區的欄位必須依序同步顯示在 PivotGrid 左上角、row field 標頭上方，內容選擇只在 PivotGrid 顯示並寫入同一個 `PivotField.filter`；不得以 `columnFields` 取代 filter field 來源。
- PivotGrid 列／欄 `＋／−` 必須單次滑鼠點擊立即生效，不得先被 CellRange pointer 流程重繪而需要第二次點擊。
- PivotChart 預設只顯示 leaf row／column aggregates，避免 subtotal／grand total 重複計算；`showTotals: true` 才納入目前可見的總計。Column／Bar／Line 可顯示多 series，Pie 由 `selectedSeries` 選擇單一 series；Pie 預設使用 Point selection、在扇形內顯示百分比，點擊後必須沿用 `fabui.Chart` 的旋轉與扇形位移動畫。PivotChart 傳入共用同一個 PivotEngine 的 PivotGrid 作為 `selectionSource` 後，必須監聽 Grid `refreshed`，依目前疊合／展開狀態重建圖表：展開群組顯示 leaf aggregates，疊合群組以可見 subtotal 取代隱藏明細，不得重新彙總原始資料；圖形 point 與 Grid 彙總 cell 必須依 Pivot row key 及 data-column binding 雙向同步選取，Pie 由 Grid 反向選取時同步切換 `selectedSeries`。`maxPoints`／`maxSeries` 只限制 SVG 繪製量，不得修改 PivotEngine view。
- PivotWorkspace 位於 `fabui.pivot.PivotWorkspace`，只負責建立／接收單一 PivotEngine、組合既有 PivotPanel／PivotGrid／PivotChart、Pane 顯示狀態、自適應排列、非同步彙總狀態、theme 傳遞與 Splitter lifecycle；不得複製 Pivot 彙總、Grid renderer 或 Chart renderer。`theme`／`setTheme(theme)` 必須將同一個 theme class 傳到 Workspace 內各個 nested `fg-root`，避免子 Grid／Panel／Chart 退回 default。Workspace 必須顯示非同步進度、取消與錯誤狀態，並以 `refreshAsync()`／`cancelRefresh()` 轉交同一 Engine。預設 Auto layout 依 host 寬度在三欄與三列間切換；Horizontal `chartSize` 接受正數 px、百分比字串或 `fr` 字串，預設 `'40%'`，百分比／`fr` 以扣除可見 Panel 與 Splitter 後的 Grid＋Chart 空間計算，Grid 為隱含 `1fr`，拖曳 Chart Splitter 後轉為固定 px。兩條 Splitter 必須支援 pointer drag 與鍵盤方向鍵，document pointer listener 只在拖曳期間綁定並於結束、取消或 dispose 立即解除。PivotGrid 標題列內建定義區／圖表區顯示切換與完整 Grid Pane 全螢幕按鈕，PivotChart 標題列內建多語系圖形類型選單與完整 Chart Pane 全螢幕按鈕；全螢幕必須包含標題列與內容並支援再次按鈕或 `Escape` 離開，瀏覽器不支援 Fullscreen API 時必須使用固定定位 fallback，Demo 不得重複實作這些控制項。隱藏 Panel／Chart 時相鄰 Splitter 一併隱藏，Grid 必須擴展並 refresh，Chart 必須 resize。Workspace 公開 `engine`、`panel`、`grid`、`chart`。
- 未來恢復 Vue 2 與 FabGrid jQuery wrapper 後，才提供 PivotPanel、PivotGrid、PivotChart、PivotWorkspace、PivotSlicer 的薄層 component／plugin；只負責 options、methods 與 lifecycle，不得複製 PivotEngine、Grid 或 Chart 行為。
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
- 日常 source 修改不要主動 build。只有使用者明確要求 build 時才更新 `dist`；build 後需確認四個主檔存在，ES5 Build Demo 必須可由 browser global 建立 Grid 與 Chart。
- Chart 修改至少執行 `node --check src/chart/chart.js` 與 `npm test`；涉及 SVG 顯示、動畫、selection 或 CSS 時，應再用瀏覽器檢查實際 path、computed style 與互動狀態。

建議輸出檔案：

```txt
dist/
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
  fabui.js
  fabui.min.js
  fabui.css
  fabui.min.css
```

打包需求：

- Source code 使用 ES6 modules 維護。
- `dist/fabui.js` 提供 browser global 可讀版本。
- `dist/fabui.min.js` 提供 browser global 壓縮版本。
- `dist/fabui.css` 整合所有核心控件、icon 與 Default theme，圖片路徑指向 `dist/theme`，不得包含其他 Theme 配色。
- `dist/fabui.min.css` 提供整合 CSS 壓縮版本。
- `dist/theme/fabui.<theme>.css` 與 `dist/theme/fabui.<theme>.min.css` 提供 Default 以外 18 組固定 selector 覆蓋樣式，不輸出重複的 Default Theme 檔，也不保留 `fabgrid.*.css` 舊檔名。
- `dist/fabui.lite.*` 提供只包含 FabGrid、內建 TreeGrid、Pivot、Chart 與必要依賴的 browser global、CSS 及壓縮版本。
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

Size layer 的 inline width 只能使用實際欄位總寬，空間有餘時由 CSS `min-width: 100%` 跟隨垂直捲動軸出現後的即時 client width；不得把捲動軸出現前量到的 viewport width 寫入 inline width，避免欄位放得下時誤產生橫向捲動軸。

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
- browser wrapper bundle 依賴全域 `Vue` 與 `fabui`。
- 未來明確恢復 Vue wrapper build 時，完整輸出到 `packages/fabgrid-vue/dist`，並將 `vue.min.js`、browser global `fabgrid-vue.js` 與 `fabgrid-vue.min.js` 同步到 `dist/wrapper`；不得併入 `dist/fabui.*` 主 bundle。
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
- 未來明確恢復 jQuery wrapper build 時，完整輸出到 `packages/fabgrid-jquery/dist`，browser minified 版本另同步到 `dist/wrapper/fabgrid-jquery.min.js`；不得併入 `dist/fabui.*` 主 bundle。
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
- `dist` 產生四個 FabUI 主檔與必要的 `theme` CSS／圖片依賴；FabUI Lite 四個檔案由 `npm run build:lite` 獨立產生。
- 能用 `<script src="./fabui.min.js">` 建立 `fabui.FabGrid` 與其他 FabUI 控件。
- Demo 頁面使用打包後的 dist 檔案運作。
- `dispose()` 會移除 listeners，且不留下明顯的殘留行為。
- 每次使用者明確要求 build 時，依「開發工作流程」定義的 `build`／`build fabui`、`build lite`、`build diagram`、`build gantt`、`build scheduler`、`build theme`、`build clear`、`build all`、逗號分隔多範圍或上述命令的 `min` 形式執行對應操作與檢查；逗號左右不得有空白，`min` 必須套用到清單中的每個範圍。Vue 2 與 FabGrid jQuery wrapper 暫緩且不納入 build gate。
