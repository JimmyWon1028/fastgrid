# fabui.MenuButton API

`fabui.MenuButton` 是 FabUI core 內建的 pure JavaScript 下拉選單按鈕。API 與 Default 視覺參考 [jQuery EasyUI MenuButton](https://www.jeasyui.com/documentation/menubutton.php)，但不依賴 jQuery 或 EasyUI runtime；內部直接組合既有 `fabui.Button` 與 `fabui.Menu`，不重複實作按鈕或 popup lifecycle。

## 建立 MenuButton

```html
<button id="editButton" type="button">編輯</button>
<div id="editMenu" style="width:160px" hidden>
  <div data-options="iconCls:'icon-undo'">復原</div>
  <div data-options="iconCls:'icon-redo'">重做</div>
  <div class="menu-sep"></div>
  <div data-options="iconCls:'icon-cut'">剪下</div>
</div>
```

```js
var editButton = new fabui.MenuButton('#editButton', {
  menu: '#editMenu',
  iconCls: 'icon-edit',
  onMenuClick: function(sender, args) {
    console.log(args.item.text);
  }
});
```

也可直接傳入既有 `fabui.Menu` instance：

```js
var menu = new fabui.Menu('#editMenu');
var button = new fabui.MenuButton('#editButton', {
  menu: menu
});
```

傳入既有 Menu 時，`MenuButton.dispose()` 不會銷毀該 Menu；傳入 selector／element 時則由 MenuButton 管理 Menu lifecycle。

## Options

MenuButton 繼承 Button 的文字、尺寸、disabled、plain、outline、icon、size、fit 與 theme options。icon 預設位於文字左側，並一律使用 `iconCls: 'icon-xxx'`。icon、文字與下拉箭頭採連續排列，三者之間不顯示分隔線；需要獨立箭頭操作區時應使用 `fabui.SplitButton`。

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `menu` | `null` | 必填；Menu selector、DOM element 或既有 `fabui.Menu`。 |
| `menuOptions` | `null` | 由 MenuButton 建立 Menu 時傳入的 `fabui.Menu` options。 |
| `plain` | `true` | 預設使用透明 Button 外觀。 |
| `menuAlign` | `'left'` | Top-level Menu 對齊 Button 的左側或右側。 |
| `duration` | `100` | Hover 顯示與離開隱藏的延遲毫秒。 |
| `showEvent` | `'mouseenter'` | 觸發顯示的 DOM event；`click` 會改為點擊展開。 |
| `hideEvent` | `'mouseleave'` | 觸發隱藏的 DOM event。 |
| `hasDownArrow` | `true` | 是否顯示右側下拉箭頭。 |
| `onClick` | `null` | Trigger click callback，簽名為 `(sender, args)`。 |
| `onShow` / `onHide` | `null` | Menu 顯示／隱藏 callback。 |
| `onMenuClick` | `null` | Menu leaf item callback；item 位於 `args.item`。 |

Markup 也可使用安全的 EasyUI 風格 `data-options`：

```html
<button
  id="editButton"
  data-options="menu:'#editMenu',iconCls:'icon-edit',menuAlign:'right'">
  編輯
</button>
```

`data-options` 只解析資料值，不執行 function 或任意程式碼。

## Properties

| 名稱 | 說明 |
| --- | --- |
| `hostElement` | 原始 `<a>` 或 `<button>`。 |
| `button` | 內部共用的 `fabui.Button` instance。 |
| `menu` | 內部共用或外部傳入的 `fabui.Menu` instance。 |
| `arrowElement` | 右側下拉箭頭 element。 |
| `theme` | 目前解析後的 FabUI theme。 |

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 MenuButton options。 |
| `show()` / `hide()` | 顯示或隱藏 Menu。 |
| `disable()` / `enable()` | 停用或啟用；停用時會同步收起 Menu。 |
| `resize({ width, height })` | 透過共用 Button 動態調整尺寸。 |
| `setText(text)` | 更新 Button 安全文字。 |
| `setIcon(iconCls, iconAlign?)` | 更新 Button icon。 |
| `setTheme(theme)` | 同步切換 Button 與 Menu theme。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除事件。 |
| `destroy()` / `dispose()` | 清除 timer／listener／registry，並還原原始 Button 與 Menu markup。 |

## Events

`on()` 支援 `click`、`show`、`hide`、`menuclick`。Event args 包含 `menuButton`、`button`、`menu`，Menu item 點擊另包含 `item` 與 `originalEvent`。

## Keyboard 與 popup lifecycle

- Trigger 按 `ArrowDown`：立即展開 Menu 並選取第一個可用項目。
- Trigger 按 `Escape`：收起 Menu 並將焦點留在 Button。
- Menu 開啟後沿用 `fabui.Menu` 的方向鍵、Home／End、Enter／Space、Escape。
- 從 Trigger 移入 Menu 時會取消隱藏計時；Trigger 與 Menu 使用同一組 mouse／pointer event family，移動到 popup 選項不會誤關閉。
- 點擊 popup 外部、捲動或 viewport 改變時，由共用 Menu lifecycle 關閉。
- 開啟其他 `fabui.Menu`／`fabui.MenuButton` 時，既有 popup 會先關閉。
- `aria-haspopup`、`aria-controls`、`aria-expanded` 會隨狀態同步更新。
