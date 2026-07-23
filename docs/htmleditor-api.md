# fabui.HtmlEditor API

`fabui.HtmlEditor` 是獨立掛載的 pure JavaScript WYSIWYG HTML 編輯器。畫面與工具列分組參考 Summernote，但不依賴 Summernote、jQuery 或 Bootstrap。

## 載入

HtmlEditor 不包含在 FabUI core。載入順序固定為 core CSS、HtmlEditor CSS、外部 Theme CSS、core JavaScript、HtmlEditor JavaScript：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.htmleditor.css">
<link rel="stylesheet" href="./dist/theme/fabui.metro-blue.css">

<textarea id="editor" name="content"></textarea>

<script src="./dist/fabui.min.js"></script>
<script src="./dist/fabui.htmleditor.min.js"></script>
<script>
  var editor = new fabui.HtmlEditor('#editor', {
    locale: 'zh-TW',
    height: 320,
    placeholder: '請輸入內容…'
  });
</script>
```

載入附加元件後，只會在既有 `fabui` namespace 增加 `fabui.HtmlEditor`，不會建立第二份 core。

## Host 與表單

Host 可使用 `<textarea>` 或一般 Element：

```html
<form method="post">
  <textarea id="article" name="article"></textarea>
</form>
```

`textarea` 在初始化後保留於表單內並隱藏，編輯內容會同步寫回其 `value`，因此原生 FormData 與一般表單送出可直接取得 HTML。`dispose()` 後會還原 host，並保留最後編輯內容。

## Constructor

```js
var editor = new fabui.HtmlEditor(element, options);
```

重複對同一 host 建立時會回傳既有 instance。可用 `fabui.Control.getControl(element)` 或 `fabui.HtmlEditor.getControl(element)` 取得 instance。

## Options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `value` | host 目前內容 | 初始 HTML。明確傳入時優先於 host。 |
| `width` | `'100%'` | 編輯器寬度。 |
| `height` | `300` | 可編輯區高度。 |
| `minHeight` | `120` | 拖曳調整的最小高度。 |
| `maxHeight` | `800` | 拖曳調整的最大高度。 |
| `placeholder` | `''` | 空白內容提示。 |
| `focus` | `false` | 初始化後是否聚焦。 |
| `disabled` | `false` | 停用所有互動。 |
| `readOnly` | `false` | 保留檢視、原始碼、全螢幕與說明，但禁止修改。 |
| `resizable` | `true` | 是否顯示底部高度調整列。 |
| `spellcheck` | `true` | 是否啟用瀏覽器拼字檢查。 |
| `locale` | `'en'` | `en`、`zh-TW` 或 `zh-CN`。 |
| `messages` | `null` | 覆寫目前語系文字。 |
| `theme` | `'inherit'` | 相容 option；配色由最後載入的 Theme CSS 決定。 |
| `toolbar` | Summernote 式預設工具列 | 自訂分組與按鈕。 |
| `fontNames` | 8 組常用字型 | 字型選單項目。 |
| `fontSizes` | `[8,10,12,14,18,24,36]` | 字級選單項目。 |
| `colors` | 64 色（8×8） | 文字顏色與文字底色色票；右下角以清除顏色按鈕取代最後一個色塊。 |
| `codeviewFilter` | `false` | 離開原始碼模式時是否移除危險 tag／attribute。 |
| `codeviewIframeFilter` | `true` | 原始碼模式只保留 YouTube／Vimeo iframe。 |

## Toolbar

預設工具列：

```js
toolbar: [
  ['style', ['style']],
  ['font', ['bold', 'italic', 'underline', 'clear']],
  ['fontname', ['fontname']],
  ['color', ['color', 'backcolor']],
  ['para', ['ul', 'ol', 'paragraph']],
  ['table', ['table']],
  ['insert', ['link', 'picture', 'video', 'hr']],
  ['history', ['undo', 'redo']],
  ['view', ['fullscreen', 'codeview', 'help']]
]
```

支援的 action：

- 樣式：`style`、`bold`、`italic`、`underline`、`strikethrough`、`superscript`、`subscript`、`clear`
- 字型：`fontname`、`fontsize`、`color`、`backcolor`
- 段落：`ul`、`ol`、`paragraph`
- 插入：`table`、`link`、`picture`、`video`、`hr`
- 歷程與檢視：`undo`、`redo`、`fullscreen`、`codeview`、`help`

自訂範例：

```js
var editor = new fabui.HtmlEditor('#editor', {
  toolbar: [
    ['font', ['bold', 'italic', 'underline']],
    ['para', ['ul', 'ol', 'paragraph']],
    ['view', ['fullscreen', 'codeview']]
  ]
});
```

## 圖片與影片

圖片對話框支援：

- `http:`／`https:` 外部圖片網址。
- 本機圖片，透過 `FileReader` 轉成 Data URL 插入。
- 圖片替代文字。

影片對話框支援：

- YouTube 網址，轉為 `youtube-nocookie.com` embed。
- Vimeo 網址，轉為 `player.vimeo.com` embed。
- `.mp4`、`.webm`、`.ogg` 直連影片。
- 其他 `http:`／`https:` 網址以 iframe 嵌入。

圖片上傳只負責瀏覽器端 Data URL；元件不包含後端上傳服務。正式應用仍應在伺服器端驗證、清理及限制儲存的 HTML。

## Methods

| Method | 說明 |
| --- | --- |
| `getValue()` | 取得目前 HTML。 |
| `setValue(value, silent?)` | 設定 HTML。`silent === true` 不觸發 `Change`。 |
| `code()` | `getValue()` 相容別名。 |
| `code(value)` | `setValue(value)` 相容別名。 |
| `focus()` | 聚焦目前 WYSIWYG 或原始碼編輯區。 |
| `toggleCodeView(force?)` | 切換／指定 HTML 原始碼模式。 |
| `isCodeView()` | 是否位於原始碼模式。 |
| `toggleFullscreen(force?)` | 切換／指定全螢幕。 |
| `isFullscreen()` | 是否為全螢幕。 |
| `resize({ width, height }, silent?)` | 調整尺寸。 |
| `disable()` | 停用元件。 |
| `enable()` | 啟用元件。 |
| `setReadOnly(value)` | 切換唯讀。 |
| `setLocale(locale, messages?)` | 切換語系。 |
| `setTheme(theme)` | 保留相容狀態；不負責載入 Theme CSS。 |
| `setOptions(options)` | 更新公開 options。 |
| `on(name, handler)` | 訂閱事件。 |
| `off(name, handler?)` | 解除事件。 |
| `dispose()`／`destroy()` | 還原 host 並解除所有 listener／popup／dialog。 |

## Events

Constructor option 使用 `on<Name>`，例如 `onChange`；也可用 `on(name, handler)` 註冊。

| Event | 參數重點 |
| --- | --- |
| `Init` | `value` |
| `Change` | `value`、`reason` |
| `Focus`／`Blur` | `originalEvent` |
| `Resize` | `width`、`height`、`cancelled?` |
| `CodeViewChange` | `active` |
| `FullscreenChange` | `active` |
| `DialogOpen`／`DialogClose` | `type` |
| `ImageUpload` | `file`、`dataUrl` |
| `Error` | `command`、`error` |

## 鍵盤

- `Ctrl/⌘ + B`：粗體。
- `Ctrl/⌘ + I`：斜體。
- `Ctrl/⌘ + U`：底線。
- `Ctrl/⌘ + Z`：復原。
- `Ctrl/⌘ + Y` 或 `Ctrl/⌘ + Shift + Z`：重做。
- `Escape`：關閉 popup；沒有 popup 時離開全螢幕。
- Resize bar 使用 `ArrowUp`／`ArrowDown` 每次調整 10px。

## 主題與語系 metadata

```js
fabui.HtmlEditor.themes;
fabui.HtmlEditor.locales;
fabui.HtmlEditor.normalizeLocale('zh_Hant_TW'); // 'zh-TW'
```

公開 `themes` 與其他 FabUI 元件相同，共 19 組。外部 Theme CSS 必須載入於 `fabui.htmleditor.css` 之後。

## Build

```bash
npm run build:htmleditor
npm run build:htmleditor -- min
```

一般 build 產生：

- `dist/fabui.htmleditor.js`
- `dist/fabui.htmleditor.min.js`
- `dist/fabui.htmleditor.css`
- `dist/fabui.htmleditor.min.css`

`min` 只保留兩個 `.min.*` 輸出。HtmlEditor 不產生 `.esm.*`，也不修改 FabUI core bundle。
