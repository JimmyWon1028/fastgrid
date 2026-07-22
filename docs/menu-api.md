# fabui.Menu API

`fabui.Menu` 是 FabUI core 內建的 pure JavaScript 選單元件。API 與 Default 視覺參考 [jQuery EasyUI Menu](https://www.jeasyui.com/documentation/menu.php)，但不依賴 jQuery 或 EasyUI runtime。

## 建立 Menu

### Markup

```html
<div id="menu" style="width:160px" hidden>
  <div data-options="name:'new',iconCls:'icon-add'">新增</div>
  <div>
    <span>開啟</span>
    <div style="width:180px">
      <div>Word</div>
      <div data-options="iconCls:'icon-excel'">Excel</div>
    </div>
  </div>
  <div class="menu-sep"></div>
  <div data-options="name:'exit',iconCls:'icon-close'">離開</div>
</div>

<script>
  var menu = new fabui.Menu('#menu');
</script>
```

`data-options` 只解析資料值，不執行其中的 function 或任意程式碼。事件 handler 請由 JavaScript options 或取得 item 後指定。

### Programmatic items

```js
var menu = new fabui.Menu('#menu', {
  minWidth: 180,
  locale: 'zh-TW',
  items: [
    { name: 'refresh', text: '重新整理', iconCls: 'icon-reload' },
    {
      name: 'export',
      text: '匯出',
      children: [
        { name: 'excel', text: 'Excel', iconCls: 'icon-excel' },
        { name: 'print', text: '列印', iconCls: 'icon-print' }
      ]
    },
    { separator: true },
    { name: 'delete', text: '刪除', disabled: true }
  ],
  onClick: function(item) {
    console.log(item.name);
  }
});
```

### Context menu

```js
document.addEventListener('contextmenu', function(event) {
  event.preventDefault();
  menu.show({
    left: event.pageX,
    top: event.pageY
  });
});
```

### Inline menu

```html
<div id="navigation" inline style="width:180px">
  <div>首頁</div>
  <div>設定</div>
</div>

<script>
  var navigation = new fabui.Menu('#navigation');
</script>
```

Inline Menu 保留在文件流內並固定顯示，不會因外部點擊而關閉。

## Item options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `id` | `null` | Item element id。 |
| `name` | `null` | 供 `findItem()` 與 command handler 使用的穩定名稱。 |
| `text` | `''` | 顯示文字。 |
| `iconCls` | `null` | 左側 icon class，統一使用 `icon-xxx` 並在 `src/fabui.icon.css` 定義。 |
| `href` | `null` | Leaf item 點擊後前往的位置。 |
| `disabled` | `false` | 停用 item。 |
| `hidden` | `false` | 隱藏 item。 |
| `separator` | `false` | 建立分隔線。 |
| `onclick` / `onClick` | `null` | Leaf item callback，參數為 item。 |
| `children` | `[]` | 子選單 item 陣列。 |
| `content` | `null` | 自訂子內容的 HTML 字串或 element。 |
| `submenuWidth` | `null` | Programmatic submenu 寬度；markup 會沿用巢狀 `<div style="width:...">`。 |
| `parent` | `null` | `appendItem()` 使用；可傳父 item 或父 item element。 |

## Menu options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `zIndex` | `110000` | Popup 層級。 |
| `left` / `top` | `0` | Popup 頁面座標；通常由 `show({ left, top })` 更新。 |
| `align` | `'left'` | 子選單優先展開方向：`left` 或 `right`；空間不足時自動翻轉。 |
| `minWidth` | `120` | 最小寬度。 |
| `itemHeight` | `32` | Item 高度；FabUI 沿用共用 popup menu 的緊湊 32px 視覺契約。 |
| `duration` | `100` | `hideOnUnhover` 的延遲毫秒。 |
| `hideOnUnhover` | `true` | 滑鼠離開 popup 後自動關閉。 |
| `inline` | `false` | 固定顯示於 parent 內。 |
| `fit` | `false` | Inline 模式填滿 parent 寬度。 |
| `items` | `[]` | Programmatic item 陣列；若 markup 內已有 item，優先使用 markup。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`，用於 ARIA 文字。 |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `ariaLabel` | `null` | 自訂 menu accessible name；未設定時使用 locale pack。 |

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 options。 |
| `show({ left, top }?)` | 顯示 popup 並限制於 viewport。 |
| `hide()` | 關閉 popup；inline 模式維持顯示。 |
| `getItem(itemElement)` | 取得包含 `target` 的 item object。 |
| `findItem(criteria)` | 依文字、name、id、比對物件或 predicate 尋找第一個 item。 |
| `findItems(criteria)` | 尋找全部符合項目。 |
| `navItems(callback)` | 深度優先巡覽全部 item；callback 回傳 `false` 可中止。 |
| `setText({ target, text })` | 更新 item 文字。 |
| `setIcon({ target, iconCls })` | 更新 item icon。 |
| `appendItem(options)` | 新增 root item、separator 或子 item，回傳新增 item。 |
| `removeItem(itemOrElement)` | 移除 item。 |
| `enableItem(itemOrElement)` / `disableItem(itemOrElement)` | 切換 item disabled。 |
| `showItem(itemOrElement)` / `hideItem(itemOrElement)` | 切換 item 顯示。 |
| `resize(menuElement?)` | 重新套用尺寸與 viewport 定位。 |
| `setTheme(theme)` | 更新相容 theme 狀態，不載入或切換 CSS。 |
| `setLocale(locale)` | 切換 ARIA 語系。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除事件。 |
| `destroy()` / `dispose()` | 清除 timers、DOM、事件與 Control registry，還原原始 markup。 |

## Events

| Callback | 參數 | 說明 |
| --- | --- | --- |
| `onShow` | 無 | Popup 顯示後觸發。 |
| `onHide` | 無 | Popup 關閉後觸發。 |
| `onClick` | `item` | Leaf item 點擊時觸發。 |
| `onDestroy` | 無 | 元件銷毀後觸發。 |

`on(name, listener)` 支援 `show`、`hide`、`click`、`destroy`；listener 會收到包含 `menu`、`item`、`originalEvent` 的 event args。

## Keyboard 與 popup lifecycle

- `ArrowDown`／`ArrowUp`：移動到下一個／上一個可用 item。
- `Home`／`End`：移動到目前層級的第一個／最後一個 item。
- `ArrowRight`：開啟子選單並進入第一個 item。
- `ArrowLeft`：關閉目前子選單並返回父 item。
- `Enter`／`Space`：開啟子選單或執行 leaf item。
- `Escape`：關閉 popup；inline 模式只收起子選單。

Popup 顯示期間才會綁定必要的 document／window listener。點擊外部、按 `Escape`、捲動或 viewport 改變會關閉 popup；點擊 menu 內部不會誤關閉。開啟另一個 `fabui.Menu` 時，既有非 inline Menu 會先關閉。

## Theme

支援 `default`、`bootstrap`、`cupertino`、`material`、`material-blue`、`material-teal`、`metro`、`metro-blue`、`metro-gray`、`metro-green`、`metro-orange`、`metro-red`、`sunny`、`pepper-grinder`、`dark-hive`、`black`、`mono`。

所有 theme 都保留固定左側 icon 欄、icon 後分隔線、清楚的 hover／active／disabled 狀態、薄邊框與輕陰影。
