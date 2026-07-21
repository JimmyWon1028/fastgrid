# fabui.CheckGroup API

`fabui.CheckGroup` 是 FabUI core 內建的 pure JavaScript 多選群組，API 與視覺參考 jQuery EasyUI CheckGroup／Default theme。每個項目都直接建立既有 `fabui.CheckBox`，不複製 checkbox renderer，也不依賴 jQuery 或 EasyUI runtime。

每個項目仍是真正的 `<input type="checkbox">`，因此共用 `name`、FormData、label、鍵盤、disabled 與 form reset 都保留原生語意。

## 建立控件

Browser global：

```html
<form>
  <div id="fruit-group"></div>
</form>
<script>
  var fruitGroup = new fabui.CheckGroup('#fruit-group', {
    name: 'fruit',
    value: ['apple'],
    data: [
      { value: 'apple', label: 'Apple' },
      { value: 'orange', label: 'Orange', disabled: true },
      { value: 'banana', label: 'Banana' }
    ]
  });
</script>
```

## Data

每個資料項目支援：

| 欄位 | 說明 |
| --- | --- |
| `value` | 項目的 API 值；原生 input 以字串送出。 |
| `label` | 顯示於 checkbox 旁的文字。 |
| `disabled` | 停用單一項目。 |

```js
data: [
  { value: '1', label: 'Item1' },
  { value: '2', label: 'Item2', disabled: true }
]
```

## Options

| Option | 預設值 | 說明 |
| --- | ---: | --- |
| `name` | `''` | 所有原生 checkbox 共用的表單欄位名稱。 |
| `value` | `[]` | 初始勾選值陣列。 |
| `data` | `[]` | 項目資料陣列。 |
| `dir` | `h` | `h` 水平排列，`v` 垂直排列。 |
| `itemStyle` | `{ height: 30 }` | 套用到每個項目容器的 inline style。 |
| `labelWidth` | `auto` | 每個 CheckBox label 寬度。 |
| `labelPosition` | `after` | `before` 或 `after`；預設每個項目文字顯示在核取方塊後方。 |
| `labelAlign` | `left` | `left` 或 `right`。 |
| `disabled` | `false` | 停用整個群組；單項 disabled 仍會保留。 |
| `cls` | `''` | 群組 host 的自訂 class。 |
| `locale` | `en` | `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `inherit` | 從外層 `fg-theme-*` 繼承，或指定 19 組內建 theme。 |
| `ariaLabel` | locale | 群組的可及性名稱。 |
| `onChange` | `null` | 選取改變 callback，簽名為 `(values)`。 |

## Methods

官方相容方法：

| Method | 說明 |
| --- | --- |
| `options()` | 回傳目前 options、value、data 與 itemStyle 的副本。 |
| `setValue(values)` | 設定勾選值陣列。 |
| `getValue()` | 依 data 順序回傳目前勾選值。 |

FabUI lifecycle 與便利方法：

| Method | 說明 |
| --- | --- |
| `setOptions(options)` | 更新 data、排列、label、狀態、locale 或 theme 並重繪。 |
| `getData()` | 回傳正規化後的 data 副本。 |
| `getCheckBox(value)` | 取得指定值的 `fabui.CheckBox` instance。 |
| `loadData(data, values?)` | 載入新的項目資料。 |
| `check(value)` / `uncheck(value)` | 勾選或取消指定值。 |
| `clear()` | 清除所有勾選。 |
| `reset()` | 還原建立時的 value。 |
| `disable()` / `enable()` | 切換整組停用狀態。 |
| `setLocale(locale, messages?)` | 切換或註冊語系。 |
| `setTheme(theme)` | 切換或重新繼承 theme。 |
| `on(type, listener)` / `off(type, listener?)` | 管理 FabUI 事件。 |
| `destroy()` / `dispose()` | 移除項目、解除 registry 並還原 host。 |

## Events

```js
var group = new fabui.CheckGroup('#group', {
  data: items,
  onChange: function(values) {
    console.log(values);
  }
});

group.on('change', function(event) {
  console.log(event.detail.values);
  console.log(event.detail.oldValues);
});
```

- `change`：使用者操作或 value API 改變勾選集合後觸發一次。
- `refresh`：`setOptions()` 重繪完成後觸發。

重複設定相同值不會再次觸發 `change`。

## 表單與 lifecycle

```js
var formData = new FormData(document.querySelector('form'));
formData.getAll('fruit');

fabui.Control.getControl('#fruit-group') === fruitGroup;

fruitGroup.dispose();
```

`dispose()` 會逐一 dispose 內部 CheckBox、解除 managed listeners 與 Control registry，並還原 host 原始 HTML、class、style、role 與 ARIA attributes。

Source-mode Demo：[`demo/dev-checkgroup.html`](../demo/dev-checkgroup.html)
Build-mode Demo：[`demo/checkgroup.html`](../demo/checkgroup.html)
