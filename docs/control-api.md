# fabui.Control API

`fabui.Control` 是 FabUI 元件的基礎類別，提供 Control registry 與受管理的 DOM listener。一般使用者不需要直接建立 `Control`；各元件會在建立與 `dispose()` 時自動登記或解除。

## 取得元件

`getControl()` 接受 DOM element 或 CSS selector。沒有已登記元件時回傳 `null`。

```js
var grid = new fabui.FabGrid('#grid', options);

fabui.Control.getControl('#grid') === grid;
```

同一 host 重複建立同類元件時，多數 FabUI 元件會回傳既有 instance。確切行為請見各元件手冊。

## 方法

| 方法 | 說明 |
| --- | --- |
| `addEventListener(target, type, listener, capture?, passive?)` | 綁定並記錄 DOM listener；相同 target、type、listener 與 capture 不會重複綁定。 |
| `removeEventListener(target?, type?, listener?, capture?)` | 解除符合條件的受管理 listener，並回傳解除數量。省略條件可一次解除多筆。 |
| `fabui.Control.getControl(elementOrSelector)` | 由 host 取得已登記的 FabUI instance。 |

## 生命週期

元件應在 `dispose()` 或 `destroy()` 時解除受管理 listener、子控件與 Control registry。完成後，`getControl()` 會回傳 `null`。

```js
grid.dispose();
fabui.Control.getControl('#grid') === null;
```

名稱以 `_` 開頭的 registry helper 是內部 API，不應由應用程式直接呼叫。
