# fabui.Messager API

`fabui.Messager` 是 FabUI core 內建的 pure JavaScript singleton 訊息服務。API 與 Default 視覺參考 [jQuery EasyUI Messager](https://www.jeasyui.com/documentation/messager.php)，但不依賴 jQuery 或 EasyUI runtime；Alert／Confirm／Prompt／Progress 直接共用 `fabui.Window`，動作按鈕共用 `fabui.Button`。

Messager 不需要 `new`：

```js
fabui.Messager.alert('提示', '資料已儲存', 'info');
```

## Alert

```js
fabui.Messager.alert(
  '警告',
  '請先完成必填欄位',
  'warning',
  function() {
    console.log('OK');
  }
);
```

支援 `error`、`question`、`info`、`warning`。也可傳入設定物件：

```js
var alertWindow = fabui.Messager.alert({
  title: '提示',
  msg: '處理完成',
  icon: 'info',
  locale: 'zh-TW',
  fn: function() {}
});
```

## Confirm

```js
fabui.Messager.confirm('確認', '確定要刪除嗎？', function(result) {
  if (result) {
    // Confirmed
  }
});
```

OK 回傳 `true`，Cancel、Escape 或右上角關閉回傳 `false`。

## Prompt

```js
fabui.Messager.prompt({
  title: '輸入',
  msg: '請輸入名稱：',
  value: 'FabUI',
  placeholder: '名稱',
  fn: function(value) {
    console.log(value);
  }
});
```

OK 回傳輸入文字；Cancel、Escape 或關閉回傳 `null`。

## Toast

```js
var toast = fabui.Messager.show({
  title: '通知',
  msg: '四秒後自動關閉',
  showType: 'slide',
  timeout: 4000
});
```

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `showType` | `slide` | `slide`、`fade`、`show`。 |
| `showSpeed` | `600` | 顯示動畫時間，毫秒。 |
| `width` / `height` | `250` / `100` | Toast 尺寸。 |
| `title` / `msg` | `''` / `''` | 標題與訊息。 |
| `timeout` | `4000` | 自動關閉時間；`0` 表示不自動關閉。 |
| `style` | `{ right:16, bottom:16 }` | `left`、`right`、`top`、`bottom` CSS 位置。 |
| `gap` | `10` | 多個預設位置 Toast 的垂直間距。 |
| `closable` | `true` | 顯示右上角關閉。 |
| `html` | `false` | 預設使用安全純文字；明確為 `true` 才解析 HTML。 |

預設 Toast 位於右下角，多個 Toast 會自動向上堆疊。Viewport resize listener 只在 Toast 存在期間綁定。

## Progress

```js
fabui.Messager.progress({
  title: '請稍候',
  msg: '正在載入資料…',
  value: 0,
  interval: 0
});

var bar = fabui.Messager.progress('bar');
bar.setValue(50).setText('50 / 100');

fabui.Messager.progress('close');
```

`interval` 預設為 `300`，會依間隔自動增加 10%，超過 100% 後回到 0；設為 `0` 可停用自動更新並自行操作 bar。`value` 預設為 `0`，設為 `null` 時使用 indeterminate 動畫；數值會限制在 `0` 到 `100`。`bar` 提供 `getValue()`、`setValue(value)`、`setText(text)`。

## 共用 Dialog options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `ok` / `cancel` | `Ok` / `Cancel` | 動作按鈕文字；未覆寫時會依 locale 顯示。 |
| `width` / `height` | `360` / `180` | Dialog 尺寸。 |
| `modal` | `true` | 是否顯示 modal mask。 |
| `draggable` | `true` | 是否允許拖曳。 |
| `resizable` | `false` | 是否允許縮放。 |
| `closable` | `true` | 是否顯示關閉按鈕。 |
| `animate` | `true` | 沿用 Window 動畫開關。 |
| `theme` | `inherit` | 繼承外層 theme 或指定內建 theme。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `html` | `false` | 訊息預設以 `textContent` 顯示。 |
| `windowIconCls` | `''` | Window 左上角 icon，統一使用 `icon-xxx`。 |
| `okIconCls` / `cancelIconCls` | `icon-ok` / `icon-cancel` | Footer Button icon。 |

## 管理方法

| Method | 說明 |
| --- | --- |
| `setTheme(theme)` | 設定預設 theme，並同步目前開啟的 Messager。 |
| `setLocale(locale)` | 設定後續 Messager 的預設語系。 |
| `close(handle, result?)` | 關閉回傳的 Window handle；Confirm 可用 `result` 指定結果。 |
| `closeAll()` | 關閉全部 Dialog、Toast 與 Progress。 |
| `activeDialogs()` | 取得目前 Alert／Confirm／Prompt Window 陣列。 |
| `activeToasts()` | 取得目前 Toast Window 陣列。 |

所有建立方法都會回傳共用的 `fabui.Window` instance，可使用 `window()`、`body()`、`setTheme()`、`isOpen()` 等既有 Window API。回傳 handle 另提供 `messager` 狀態與 `closeMessage(result)`。

## Keyboard 與 accessibility

- Dialog 建立後會聚焦第一個動作按鈕；Prompt 聚焦輸入框。
- `Enter` 執行 OK。
- `Escape` 依 Alert／Confirm／Prompt 契約關閉。
- `Tab`／`Shift+Tab` 將焦點保留在 modal Dialog 內。
- Dialog 沿用 Window 的 `role="dialog"`、`aria-modal`、標題與 modal mask。
- 訊息 icon 使用集中在 `src/fabui.icon.css` 的 `icon-info`、`icon-warning`、`icon-question`、`icon-error`。
