# fabui.SplitButton API

`fabui.SplitButton` 是 FabUI core 內建的 pure JavaScript 分割按鈕。API 與 Default 視覺參考 [jQuery EasyUI SplitButton](https://www.jeasyui.com/documentation/splitbutton.php)，但不依賴 jQuery 或 EasyUI runtime；內部直接組合既有 `fabui.MenuButton`，不重複實作 Button、Menu 或 popup lifecycle。

SplitButton 分成主區域與右側箭頭區：

- 主區域 click 只執行 `onClick`，不開啟 Menu。
- 箭頭區 click 或停留 `duration` 毫秒後開啟 Menu。

## 建立 SplitButton

```html
<a id="editButton" href="javascript:void(0)">編輯</a>
<div id="editMenu" style="width:160px" hidden>
  <div data-options="iconCls:'icon-undo'">復原</div>
  <div data-options="iconCls:'icon-redo'">重做</div>
  <div class="menu-sep"></div>
  <div data-options="iconCls:'icon-cut'">剪下</div>
</div>
```

```js
var editButton = new fabui.SplitButton('#editButton', {
  menu: '#editMenu',
  iconCls: 'icon-edit',
  onClick: function() {
    console.log('執行預設編輯動作');
  },
  onMenuClick: function(sender, args) {
    console.log(args.item.text);
  }
});
```

`menu` 也可傳入 DOM element 或既有 `fabui.Menu` instance。傳入既有 Menu 時，`dispose()` 不會銷毀該 Menu。

## Options

SplitButton 沿用 [Button API](./button-api.md) 的 `width`、`height`、`id`、`disabled`、`toggle`、`selected`、`group`、`plain`、`outline`、`text`、`iconCls`、`iconAlign`、`size`、`fit`、`cls`、`theme` 與 `onResize`，並沿用 MenuButton 的 Menu options。

icon 預設位於文字左側，並一律使用 `iconCls: 'icon-xxx'`。主操作區與箭頭區的分隔線預設隱藏，只在滑鼠移入整個 SplitButton 時顯示。

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `menu` | `null` | 必填；Menu selector、DOM element 或既有 `fabui.Menu`。 |
| `menuOptions` | `null` | 由內部 MenuButton 建立 Menu 時使用的 options。 |
| `plain` | `true` | 預設使用透明 Button 外觀。 |
| `menuAlign` | `'left'` | Top-level Menu 對齊 SplitButton 的左側或右側。 |
| `duration` | `100` | 箭頭 hover 後顯示 Menu 的延遲毫秒。 |
| `onClick` | `null` | 主區域 click callback，簽名為 `(sender, args)`。 |
| `onArrowClick` | `null` | 箭頭區 click callback；回傳 `false` 可取消切換 Menu。 |
| `onShow` / `onHide` | `null` | Menu 顯示／隱藏 callback。 |
| `onMenuClick` | `null` | Menu leaf item callback；item 位於 `args.item`。 |

Markup 可使用安全的 EasyUI 風格 `data-options`：

```html
<a
  id="editButton"
  data-options="menu:'#editMenu',iconCls:'icon-edit',menuAlign:'right'">
  編輯
</a>
```

`data-options` 只解析資料值，不執行 function 或任意程式碼。

## Properties

| 名稱 | 說明 |
| --- | --- |
| `hostElement` | 原始 `<a>`。 |
| `menuButton` | 內部共用的 `fabui.MenuButton` instance。 |
| `button` | MenuButton 內部的 `fabui.Button` instance。 |
| `menu` | MenuButton 內部共用或外部傳入的 `fabui.Menu` instance。 |
| `arrowElement` | 可獨立操作的右側箭頭 element。 |
| `theme` | 目前解析後的 FabUI theme。 |

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 SplitButton options。 |
| `show()` / `hide()` | 顯示或隱藏 Menu。 |
| `disable()` / `enable()` | 停用或啟用；停用時同步收起 Menu。 |
| `resize({ width, height })` | 透過共用 MenuButton 動態調整尺寸。 |
| `setText(text)` | 更新主區域的安全文字。 |
| `setIcon(iconCls, iconAlign?)` | 更新主區域 icon。 |
| `setTheme(theme)` | 同步相容 theme 狀態，不載入或切換 CSS。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除事件。 |
| `destroy()` / `dispose()` | 清除 timer／listener／registry，並還原原始 Button 與 Menu markup。 |

## Events

`on()` 支援 `click`、`arrowclick`、`show`、`hide`、`menuclick`。Event args 包含 `splitButton`、`menuButton`、`button`、`menu`；Menu item 點擊另包含 `item` 與 `originalEvent`。

## Keyboard 與 popup lifecycle

- `Enter`／`Space`：執行主區域動作。
- `ArrowDown`：立即展開 Menu 並選取第一個可用項目。
- `Escape`：收起 Menu 並將焦點留在 SplitButton。
- Menu 開啟後沿用 `fabui.Menu` 的方向鍵、Home／End、Enter／Space、Escape。
- 從右側箭頭移入 Menu 時會取消隱藏計時，popup 會保持開啟以供選取項目。
- 點擊 popup 外部、捲動或 viewport 改變時，由共用 Menu lifecycle 關閉。
- 開啟其他 FabUI popup 時，既有 Menu 會先關閉。
- `aria-haspopup`、`aria-controls`、`aria-expanded` 會隨狀態同步更新。
