# fabui.Diagram API 操作手冊

`fabui.Diagram` 是獨立的 pure JavaScript SVG 圖表設計器，不包含在 FabUI core。它不依賴 DevExtreme 或 jQuery；內部重用 `fabui.Button`、`fabui.EditBox` 與 `fabui.Menu`。

主工具列提供檔案、輸出、歷程、連線、面板與唯讀操作。右下角檢視工具列提供縮放、符合、格線、投影片展示與全螢幕。紙張小於 viewport 時會置中，放大後可正常捲動。

工具箱提供一般、流程圖、DFD 與組織圖四類共 47 種圖形。分類可展開、排序與搜尋，切換語系時保留狀態。

工具箱與屬性面板可浮動或停靠左右兩側。同側停靠可使用底部 `tabs`，或使用上下排列的 `stacked`；面板支援滑鼠及鍵盤調整尺寸。

DFD 提供 Entity、Process、Data Store、Data Flow 與 S Curve。S Curve 使用三次貝茲曲線。

工具箱與屬性面板同時浮動時，點擊任一面板的標題、內容、控件或尺寸調整邊緣，會將該面板與它的 resizer 一起提到最上層，不會改變原有位置或尺寸。

## 載入與建立

Diagram 必須在 FabUI core 之後載入：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.diagram.css">
<script src="./dist/fabui.js"></script>
<script src="./dist/fabui.diagram.js"></script>
```

`npm run build:diagram` 只建立 `dist/fabui.diagram.js`、`.min.js`、`.css` 與 `.min.css`。`npm run build` 不會改寫 Diagram；`npm run build:all` 才會包含它。

```html
<div id="diagram"></div>
<script>
  var diagram = new fabui.Diagram('#diagram', {
    height: 620,
    locale: 'zh-TW',
    nodes: [{
      id: 'start',
      type: 'terminator',
      text: '開始',
      x: 80,
      y: 80
    }, {
      id: 'review',
      type: 'process',
      text: '審核',
      x: 320,
      y: 80
    }],
    connectors: [{
      id: 'c1',
      from: 'start',
      to: 'review'
    }]
  });
</script>
```

同一個 host 重複建立時會回傳既有 instance。也可用 `fabui.Diagram.getControl(host)` 或 `fabui.Control.getControl(host)` 取得 instance。

## 資料格式

### Node

| 欄位 | 說明 |
| --- | --- |
| `id` | 唯一字串 id；省略時自動產生。 |
| `type` | 圖形類型；完整值見下方「Node 類型」。 |
| `text` | 圖形內文字。 |
| `fontSize` | 文字大小，預設 `14`，屬性面板限制為 8～96。 |
| `fontBold`／`fontItalic`／`fontUnderline`／`fontStrikethrough` | 粗體、斜體、底線與刪除線布林值，預設皆為 `false`。 |
| `hyperlink` | 圖形文字的超連結；屬性區欄位位於「文字」下方。接受 `http:`、`https:`、`mailto:`、`tel:`、`javascript:`、相對網址與頁內錨點；未指定協定的網址會補上 `https://`，其他協定不會啟用。`javascript:` 可執行任意頁面程式，只能使用可信任內容。 |
| `hyperlinkTrigger` | 超連結觸發方式：`click`（預設，單擊觸發）或 `dblclick`（雙擊觸發）；屬性區欄位緊接在「超連結」下方。 |
| `x`／`y` | 頁面座標。 |
| `width`／`height` | 圖形尺寸，最小 40×30。 |
| `fill`／`stroke`／`strokeWidth` | 填色、框線色與框線寬度。 |
| `textColor` | 文字顏色。 |

#### Node 類型

| 分類 | `type` |
| --- | --- |
| 一般 | `text`、`rectangle`、`ellipse`、`cross`、`triangle`、`diamond`、`heart`、`pentagon`、`hexagon`、`octagon`、`star`、`arrowUp`、`arrowDown`、`arrowLeft`、`arrowRight`、`arrowUpDown`、`arrowLeftRight`、`roundedRectangle`、`cloud` |
| 流程圖 | `process`、`decision`、`terminator`、`predefinedProcess`、`document`、`multipleDocuments`、`manualInput`、`preparation`、`data`、`database`、`directData`、`internalStorage`、`paperTape`、`manualOperation`、`delay`、`storedData`、`sequentialData`、`merge`、`onPageReference`、`summingJunction`、`orJunction`、`display` |
| DFD | `dfdEntity`、`dfdProcess`、`dfdDataStore` |
| 組織圖 | `orgChartImageLeft`、`orgChartImageRight`、`orgChartImageTop` |

### Connector

| 欄位 | 說明 |
| --- | --- |
| `id` | 唯一字串 id。 |
| `from`／`to` | 起點與終點 node id。 |
| `fromPoint`／`toPoint` | 六個連接點名稱：`top`、`rightTop`、`rightBottom`、`bottom`、`leftBottom`、`leftTop`；省略時每次重繪都依兩個圖形的距離與朝向重新選擇最適合的邊中點。 |
| `type` | `orthogonal`、`straight`、`curved` 或 `sCurve`。 |
| `controlX`／`controlY` | 拖曳連線後保存的控制點座標；直線形成折點、直角線移動中段、一般弧線調整二次貝茲曲線，S 弧線則調整三次貝茲曲線的中心控制位置。 |
| `text` | 連線標籤；顯示於線條中點上方，後方以目前紙張底色遮住線條，避免文字與 connector 重疊。 |
| `fontSize` | 標籤文字大小，預設 `14`，屬性面板限制為 8～96。 |
| `fontBold`／`fontItalic`／`fontUnderline`／`fontStrikethrough` | 標籤的粗體、斜體、底線與刪除線布林值，預設皆為 `false`。 |
| `stroke`／`strokeWidth` | 線條色與寬度。 |
| `lineStyle` | `solid` 或 `dashed`。 |
| `arrowDirection` | `none`、`end`、`start` 或 `both`；預設 `end`。 |

`setData()`／`import()` 也接受 `edges` 作為 `connectors` 的相容別名。指向不存在 node 或自行連回同一 node 的 connector 會被排除。

所有 connector 端點都會依連線方向投影到圖形的實際輪廓；橢圓、菱形與其他多邊形不會停在外接矩形的空白區。

連線可直接以滑鼠拖曳；選取後會顯示中段控制點。拖曳 `curved` 連線會移動二次貝茲曲線控制點以改變弧度；拖曳 `sCurve` 會移動 S 型三次貝茲曲線的中心控制位置。結果都會保存到 JSON 並支援 undo／redo。

選取 connector 後，可在屬性區的「箭頭」切換無箭頭、指向終點、指向起點或雙向箭頭；變更會保存到 JSON 並支援 undo／redo。

按下工具列「連線」後，做圖區會切換為十字指標且暫停圖形拖曳。可從起點圖形內任意位置按住，拖曳至另一個圖形內任意位置後放開；Diagram 會建立 connector，並依兩個圖形目前的位置與朝向自動選擇合適的起訖端點。

## Options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `width`／`height` | `'100%'`／`620` | 元件尺寸。 |
| `nodes`／`connectors` | `[]`／`[]` | 初始資料。 |
| `paperSize`／`paperOrientation` | `'A4'`／`'landscape'` | 紙張尺寸與方向；尺寸支援 A3、A4、A5、Letter、Legal，方向支援 `portrait`／`landscape`。 |
| `pageWidth`／`pageHeight` | `1123`／`794` | SVG 頁面尺寸；未明確指定時依紙張設定換算，預設為 A4 橫向。 |
| `pageColor` | `'#ffffff'` | 頁面底色。 |
| `showGrid`／`snapToGrid` | `true`／`true` | 顯示格線與拖曳貼齊格線。 |
| `gridSize` | `20` | 格線間距。 |
| `zoomLevel` | `1` | 初始縮放比例。 |
| `minZoom`／`maxZoom` | `0.25`／`2` | 縮放範圍。 |
| `toolbox`／`toolboxSearch` | `true`／`true` | 顯示圖形工具箱與搜尋欄。 |
| `toolboxWidth` | `260` | 工具箱初始寬度，單位為 px。 |
| `toolboxMinWidth`／`toolboxMaxWidth` | `140`／`420` | 工具箱拖曳與 API 調整的寬度上下限。 |
| `toolboxHeight` | `520` | 浮動工具箱初始高度，單位為 px。 |
| `toolboxMinHeight`／`toolboxMaxHeight` | `180`／`720` | 浮動工具箱拖曳與 API 調整的高度上下限。 |
| `toolboxFloating` | `false` | 初始是否將工具箱顯示為繪圖工作區內的浮動面板。 |
| `toolboxFloatLeft`／`toolboxFloatTop` | `12`／`12` | 浮動工具箱相對於工作區左上角的位置，單位為 px；超出範圍時會自動限制在工作區內。 |
| `toolboxDockSide` | `'left'` | 工具箱停靠側，支援 `'left'`／`'right'`。 |
| `toolboxCollapsed` | `{ general: false, flowchart: true, dfd: true, orgChart: true }` | 各工具箱分類的初始疊合狀態；預設只展開第一個「一般」分類。 |
| `toolboxOrder` | `['general', 'flowchart', 'dfd', 'orgChart']` | 工具箱分類的初始上下順序；遺漏的內建分類會依預設順序補回。 |
| `toolboxStateKey` | `''` | 指定 `localStorage` key 後，會保存完整做圖進度（紙張、nodes、connectors）、分類展開／順序、工具箱與屬性面板的版面狀態、同側排列模式、作用中 tab，以及檢視工具列的拖曳位置；重新載入時優先載入最後保存的做圖內容。新增、修改、移動、縮放、刪除、清除、JSON 載入、undo 與 redo 都會立即更新。舊版沒有 `diagram` 的內容仍可讀取；空字串不保存。 |
| `propertiesPanel` | `true` | 顯示選取項目的屬性區。 |
| `propertiesWidth` | `230` | 屬性面板初始寬度，單位為 px。 |
| `propertiesMinWidth`／`propertiesMaxWidth` | `180`／`420` | 屬性面板拖曳與 API 調整的寬度上下限。 |
| `propertiesHeight` | `520` | 浮動屬性面板初始高度，單位為 px。 |
| `propertiesMinHeight`／`propertiesMaxHeight` | `180`／`720` | 浮動屬性面板拖曳與 API 調整的高度上下限。 |
| `propertiesFloating` | `false` | 初始是否將屬性面板顯示為繪圖工作區內的浮動面板。 |
| `propertiesFloatLeft`／`propertiesFloatTop` | `12`／`12` | 浮動屬性面板相對於工作區左上角的位置，單位為 px；超出範圍時會自動限制在工作區內。 |
| `propertiesDockSide` | `'right'` | 屬性面板停靠側，支援 `'left'`／`'right'`，可與工具箱停靠於同一側。 |
| `sameSideDockMode` | `'tabs'` | 兩個面板同側停靠時的排列，支援底部分頁 `'tabs'` 或工具箱在上、屬性在下的 `'stacked'`。 |
| `sameSideDockTab` | `'toolbox'` | 工具箱與屬性面板初始同側停靠時的作用中 tab，支援 `'toolbox'`／`'properties'`。 |
| `mainToolbar`／`viewToolbar` | `true`／`true` | 顯示主工具列與畫面工具列；主工具列包含編輯、JSON、PNG／SVG 匯出與列印，浮動檢視工具列包含投影片展示與全螢幕。 |
| `viewToolbarLeft`／`viewToolbarTop` | `null`／`null` | 檢視工具列的初始左／上座標，單位為 px；`null` 使用預設右下位置。 |
| `contextMenu` | `true` | 在做圖區按滑鼠右鍵顯示匯出 PNG、匯出 SVG、列印與「投影片展示」選單。 |
| `readOnly`／`disabled` | `false`／`false` | 唯讀或停用互動。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `ariaLabel` | `''` | 覆寫 Diagram host 的 accessible name。 |

上方工具列的「工具箱」按鈕可在執行期間開啟或關閉左側工具箱；關閉時會一併隱藏寬度調整 splitter，重新開啟後保留目前 `toolboxWidth` 與各分類的展開／疊合狀態。按鈕的 pressed 狀態會與 `options.toolbox` 同步。

連線工具支援直線、直角線、弧線與 S 線，預設為直角線。類型按鈕設定下一條 connector 的 `type`，「連線」按鈕則切換連線模式。

新 connector 預設使用 `arrowDirection: 'end'`，箭頭指向目標圖形。

「唯讀」按鈕會呼叫 `setReadOnly()` 鎖定或解除鎖定做圖區，pressed 狀態與 `options.readOnly` 同步。唯讀時主工具列仍保持顯示，以便解除唯讀；復原、重做、刪除、清除、載入、連線、工具箱與屬性等編輯操作會停用，工具箱及屬性區會隱藏，但縮放、符合、格線、全螢幕、下載、右鍵匯出與投影片展示等檢視操作仍可使用。

每個工具箱分類標題右側都有 icon-only 拖曳把手；只有從該 icon 上下拖曳才會調整「一般／流程圖／DFD／組織圖」的排列，點擊標題仍只控制展開／疊合。拖曳位置會顯示 55% 半透明插入線；設定 `toolboxStateKey` 後，新順序會與分類展開狀態及兩個面板的版面狀態一起記憶。

工具箱最上方的「工具箱」標題是整個面板的拖曳把手。從停靠狀態往繪圖工作區拖曳會轉為浮動；浮動時可繼續移動，拖至工作區左側或右側的停靠提示區並放開就會重新停靠。停靠至屬性面板所在側時，兩者依 `sameSideDockMode` 改用底部 Tabs 或上下排列；Tabs 模式會讓工具箱成為作用中 tab。這項互動不會改變分類的排列或展開狀態。

設定 `toolboxStateKey` 後，每次 Diagram 資料提交都會把 `getData()` 的紙張、nodes 與 connectors 寫入同一份 `localStorage` 狀態；下次建立相同 key 的 Diagram 時，保存進度會優先於建構 options 的初始 nodes／connectors 自動載入。呼叫 `setData()` 或 Demo 的「還原範例」也會立即覆寫保存進度。

「屬性」標題也是面板拖曳把手。往繪圖工作區拖曳會轉為浮動；浮動時可拖至左側或右側重新停靠，停靠至工具箱所在側時，兩者依 `sameSideDockMode` 改用底部 Tabs 或上下排列；Tabs 模式會讓屬性成為作用中 tab，不會改變工具箱的停靠側。面板內的 EditBox 與其他屬性操作不會觸發拖曳。

工具箱與屬性面板停靠時，將滑鼠移到朝畫布中央的邊緣會顯示左右調寬指標，該側同時顯示 1px 面板框線；浮動時左右兩個邊緣可調整寬度，上下兩個邊緣可調整高度，並維持完整外框。6px 操作區保持透明，不顯示額外 splitter 色帶；方向鍵每次移動對應邊緣 10px，按住 Shift 時每次 30px。由左邊或上邊調整時，右邊或下邊的位置保持不變。

選取 node 時，屬性面板將 `X`／`Y` 並排於同一列，並將「寬度」／「高度」並排於下一列；四個欄位仍分別寫回原本的 node property。

選取 node 或 connector 時，屬性面板可用 `fontSize`（8～96）調整文字大小，並以 `fontBold`、`fontItalic`、`fontUnderline`、`fontStrikethrough` 四個 toggle 控制粗體、斜體、底線與刪除線。這些欄位會保存於 JSON，套用後立即重繪，並沿用既有 undo／redo lifecycle；圖形超連結的必要底線可與刪除線同時顯示。

同時選取兩個以上 node 時，屬性面板提供批次共用欄位：`fontSize`、四種文字樣式、`width`、`height`、`fill` 與 `stroke`。選取項目的值不一致時，EditBox 以空白與 `—` 顯示混合狀態；輸入新值或切換樣式後會一次套用到全部選取 node，並只提交一筆 undo／redo history。為避免覆寫不同內容或讓圖形重疊，多選時不提供 `text`、`hyperlink`、`hyperlinkTrigger`、`x` 與 `y` 批次欄位。

同時選取兩個以上 node 時，Diagram 會在所有圖形外側顯示共用虛線外框與四個角落縮放控制點。拖曳角落時以整組中心固定並等比例縮放每個 node 的位置、寬度與高度，因此圖形尺寸及彼此間距使用同一比例同步放大或縮小；整組內具有自訂控制點的 connector 也會同步縮放控制點。單次拖曳只建立一筆 history，支援 undo／redo 與 pointer cancel 還原。

## Methods

| Method | 說明 |
| --- | --- |
| `getData()`／`setData(data)` | 取得深層副本或替換完整 Diagram 資料。 |
| `getPaper()`／`setPaper(size, orientation, gridSize?)` | 取得或設定紙張尺寸、方向與吸附間距；設定後會更新畫布尺寸及格線。`getPaper()` 與 JSON `page` 使用 `gridSize` 保存吸附間距。 |
| `getNode(id)`／`getConnector(id)` | 取得目前資料中的項目。 |
| `addNode(node)`／`addConnector(connector)` | 新增圖形或連線。 |
| `removeSelected()` | 刪除所有選取項目；刪除 node 時一併刪除相連 connector。 |
| `clearPage()` | 清除目前紙張上的所有圖形與連線，保留紙張尺寸、方向及底色；可使用 `undo()` 復原。 |
| `selectItem(type, id)`／`clearSelection()`／`getSelection()` | 管理單一主要選取；多選時 `getSelection()` 回傳最後選取的主要 node。 |
| `getSelections()` | 取得目前所有選取項目的 `{ type, id }` 陣列。 |
| `setConnectMode(enabled, type?)` | 進入連線模式，再依序點擊起點與終點圖形；`type` 支援 `'orthogonal'`、`'straight'`、`'curved'`、`'sCurve'`。 |
| `undo()`／`redo()`／`canUndo()`／`canRedo()` | 管理編輯歷程。 |
| `setZoom(value)`／`fitToContent()`／`fitToPage(padding?)` | 設定縮放、符合目前內容或縮放到可看見整張紙；`padding` 預設為 12px。 |
| `setShowGrid(value)` | 顯示或隱藏格線。 |
| `getToolboxWidth()`／`setToolboxWidth(width)` | 取得或調整工具箱寬度，設定值會限制在 `toolboxMinWidth` 與 `toolboxMaxWidth` 之間。 |
| `getToolboxHeight()`／`setToolboxHeight(height)` | 取得或調整浮動工具箱高度，設定值會限制在 `toolboxMinHeight` 與 `toolboxMaxHeight` 之間。 |
| `getPropertiesWidth()`／`setPropertiesWidth(width)` | 取得或調整屬性面板寬度，設定值會限制在 `propertiesMinWidth` 與 `propertiesMaxWidth` 之間。 |
| `getPropertiesHeight()`／`setPropertiesHeight(height)` | 取得或調整浮動屬性面板高度，設定值會限制在 `propertiesMinHeight` 與 `propertiesMaxHeight` 之間。 |
| `isToolboxFloating()` | 回傳工具箱目前是否為浮動狀態。 |
| `floatToolbox(left?, top?)`／`dockToolbox(side?)` | 將工具箱切換為工作區內的浮動面板，或獨立停靠於指定的 `'left'`／`'right'`；不改變屬性面板的停靠側，浮動座標超出範圍時會自動限制。 |
| `isPropertiesFloating()` | 回傳屬性面板目前是否為浮動狀態。 |
| `floatProperties(left?, top?)`／`dockProperties(side?)` | 將屬性面板切換為工作區內的浮動面板，或獨立停靠於指定的 `'left'`／`'right'`；不改變工具箱的停靠側，浮動座標超出範圍時會自動限制。 |
| `getSameSideDockMode()`／`setSameSideDockMode(mode)` | 取得或切換兩個面板同側停靠時的 `'tabs'`／`'stacked'` 排列；設定 `toolboxStateKey` 時會保存最後模式。 |
| `setReadOnly(value)` | 設定做圖區唯讀狀態；內建工具列「唯讀」按鈕會同步 pressed 狀態。 |
| `toggleFullscreen()` | 切換完整 Diagram 編輯器全螢幕；包含上方工具列、工具箱、屬性區、做圖區與右下角檢視工具列，並將完整紙張縮放至可用做圖區。進入後仍可用「−／＋」在 `minZoom` 至 `maxZoom` 間自由縮放，不會被自動符合頁面的比例限制。 |
| `togglePresentationFullscreen()` | 切換只有做圖 viewport 的投影片全螢幕；進入後以 24px 舞台留白將完整紙張放大置中，離開時還原原本縮放與捲動位置。工具箱、屬性區與上下工具列不會進入全螢幕。 |
| `loadJsonFile()` | 開啟本機 `.json` 檔案選擇器；讀取成功後透過既有 `import()`／`setData()` 替換圖面並縮放至完整紙張。 |
| `import(jsonOrObject)` | 匯入 JSON 字串或資料物件。 |
| `export(filename?)` | 回傳 JSON；傳入檔名時同時下載。 |
| `getSvg()`／`exportSvg(filename?)` | 取得或下載 SVG。 |
| `exportPng(filename?, scale?)` | 以 Promise 回傳 PNG Blob；預設 2 倍解析度，傳入檔名時同時下載。 |
| `print()` | 在目前頁面的隱藏列印框架中載入不含網格的紙張 SVG，以目前 `paperSize` 與 `paperOrientation` 設定列印預覽方向，預設以零頁邊距排除瀏覽器 header／footer，再於內容內保留 12mm 留白，並將完整 SVG 等比例限制在單頁內；不開啟新分頁或新視窗，若無法建立列印框架則回傳 `false`。 |
| `setLocale(locale)`／`setTheme(theme)`／`setReadOnly(value)` | 更新語系、相容 theme 狀態與唯讀狀態；`setTheme()` 不切換 CSS。 |
| `render()` | 依目前資料重畫 SVG。 |
| `destroy()`／`dispose()` | 移除 listener、內部控件與 registry，還原原始 host。 |

## Events

建構 option 使用 `onXxx`，也可用 `diagram.on(name, listener)`／`off()` 監聽對應小寫事件。

- `onContentReady`
- `onSelectionChanged`
- `onItemClick`
- `onItemDblClick`
- `onChanged`
- `onHyperlinkClick`
- `onReadOnlyChanged`
- `onJsonLoaded`
- `onLoadError`

`onChanged` 的 event args 包含 `action`、完整 `data`，以及變更項目的 `itemType`／`item`。
工具列按鈕或程式呼叫 `setReadOnly()` 改變唯讀狀態時，`onReadOnlyChanged` 會收到目前的 `readOnly`。
依 `hyperlinkTrigger` 點擊 node 文字時，`onHyperlinkClick` 會收到 `itemType`、`item` 與 `url`。一般連結使用新分頁；`javascript:` 會在目前頁面執行，只能使用可信任內容。
工具列載入 JSON 成功時，`onJsonLoaded` 收到 `file` 與匯入後的 `data`；檔案無法讀取或 JSON 無效時，`onLoadError` 收到 `file` 與 `error`，目前圖面保持不變。

## 操作與鍵盤

- 從工具箱點擊或拖曳圖形到畫布。
- 未指定固定連接點的 connector 會在圖形拖曳後自動重選最適合的兩側端點；直角線會依端點所在邊向外離開並從正確方向進入另一圖形。
- 上方工具列的「清除頁面」會移除紙張上的所有圖形與連線，但保留紙張設定，並可使用復原還原內容。
- 上方工具列的「下載」會將包含紙張、圖形與連線的目前資料下載為 `fabui-diagram.json`；「載入」只接受 JSON 檔案，成功後替換圖面，無效檔案不會改變目前內容。
- 拖曳工具箱或屬性面板最上方標題可讓面板浮動；浮動時可拖至工作區左側或右側停靠提示區重新 dock。若目標側已有另一面板，會依 `sameSideDockMode` 使用底部 Tabs 或工具箱在上、屬性在下的排列，且不移動原面板。分類標題右側 icon 仍只負責上下排序分類。
- 右下角檢視工具列可拖曳，位置限制在 Diagram 範圍內。設定 `toolboxStateKey` 後，會連同面板與工具箱狀態一起還原位置。
- 拖曳工具箱右側分隔把手可調整寬度；把手取得焦點後，左右方向鍵每次調整 10px，搭配 `Shift` 時每次調整 30px。
- 上方工具列與做圖區右鍵選單都可匯出 PNG、匯出 SVG 及列印目前紙張；浮動檢視工具列與右鍵選單都可選擇「投影片展示」，展示期間 icon-only Button 的 tooltip／ARIA 與右鍵選單文字都會切換為「離開投影片展示」。
- 右下角「全螢幕」顯示完整 Diagram 編輯器；進入時先自動符合頁面，之後可繼續使用「−／＋」手動縮放。做圖區右鍵「投影片展示」只顯示 viewport，將紙張依螢幕尺寸放大置中。兩者離開後都會還原原本的縮放與捲動位置。
- 單擊畫布空白處會清除圖形／連線選取，並在屬性面板顯示重用 `fabui.EditBox` 的紙張尺寸、方向與最小 5px 吸附間距；變更後立即更新格線與 snap，並保存在 `getData()`／匯出 JSON 的 `page.gridSize` 欄位。有效的 `toolboxStateKey` 會額外記住完整 `page`，重新載入時還原；載入含 `page` 的 JSON 也會更新這份記憶。空白處雙擊不再開啟 modal 視窗。
- DFD 的 Entity、圓形 Process、Data Store 與其他 node 共用圖形內文字編輯；雙擊後以透明多行 `fabui.EditBox` 輸入文字。Demo 的開立製令、倉庫領料、生產工序與完工入庫均使用等寬高的圓形 `dfdProcess`。
- 組織圖提供 `orgChartImageLeft`、`orgChartImageRight`、`orgChartImageTop` 三種人員卡片；拖入畫布後保留一般 node 的拖曳、縮放、六點連線、屬性與圖形內文字編輯。
- Node 超連結可設定單擊或雙擊觸發，不需要預先選取圖形。一般網址在新分頁開啟；script URL 只可用於可信任內容。
- 紙張放大超過 viewport 後，在沒有圖形、線條或控制點的空白處按住滑鼠左鍵拖曳可平移做圖區；`pointercancel` 會還原原本捲動位置。未超出範圍時空白處拖曳仍執行框選；放大狀態按住 `Shift`、`Ctrl` 或 `Cmd` 拖曳也可強制框選。
- 多選圖形可一起拖曳、使用方向鍵移動或刪除；主要 node 仍可使用八個方形控制點縮放。
- 拖曳單一或多個圖形時，若相連的直角線端點在目前吸附間距的 75% 內，並位於 5～16px 的自動對齊範圍，Diagram 會微調整組圖形，讓連線自動成為水平或垂直直線；具有自訂控制點的線條不會自動對齊。
- 多選兩個以上圖形後，拖曳整組虛線外框的四角控制點會以群組中心等比例縮放所有圖形；每個圖形的尺寸、中心距離與圖形之間的空白間距都使用相同倍率，內部連線會跟隨新位置與控制點。
- 每個已選圖形會顯示六個圓形連接點；從其中一點拖到另一圖形的連接點即可建立 connector，並保存 `fromPoint`／`toPoint`。
- 在 node 圖形上雙擊會於圖形內開啟透明多行 `fabui.EditBox` 並自動全選文字；`Enter` 換行，`Ctrl／Command + Enter` 或失焦提交，`Escape` 取消。
- 在 connector 線條上雙擊會於線條中點開啟 `fabui.EditBox`；按 `Enter` 或離開輸入框提交文字，按 `Escape` 取消。提交後標籤顯示在線條中點上方，文字後方使用目前紙張底色遮罩，線條不會穿過文字並會從標籤下方清楚接續。
- 點選圖形或連線後可直接按 `Delete`／`Backspace` 刪除，不必再點 Diagram 外框取得焦點；焦點位於屬性 EditBox、搜尋、就地文字編輯或其他互動控件時，保留控件原生鍵盤行為，不得刪除圖形或連線。
- 滑鼠位於繪圖 viewport 時，滾輪向上會放大、向下會縮小，並以滑鼠所在位置作為縮放中心；縮放比例仍受 `minZoom`／`maxZoom` 限制。工具箱與屬性區的滾輪維持一般捲動。
- `Ctrl/Cmd + Z`：復原；`Ctrl/Cmd + Shift + Z` 或 `Ctrl/Cmd + Y`：重做。
- 方向鍵：移動選取 node；按住 `Shift` 每次移動 10。
- `Escape`：離開連線模式並清除選取。

Source-mode Demo：[`demo/dev-diagram.html`](../demo/dev-diagram.html)
Build-mode Demo：[`demo/diagram.html`](../demo/diagram.html)
