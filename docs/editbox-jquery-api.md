# fabui.EditBox jQuery Wrapper API

`fabeditbox-jquery` 是 `fabui.EditBox` 的薄型 jQuery adapter。它只負責 instance、option、方法、事件與生命週期轉接，實際控件由 FabUI core 的 `fabui.EditBox` 提供。

## Browser global

依序載入 jQuery、包含 `fabui.EditBox` 的 FabUI core 與 wrapper；不需要載入獨立 EditBox bundle：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<input id="amount">

<script src="./jquery.min.js"></script>
<script src="./dist/fabui.min.js"></script>
<script src="./dist/wrapper/fabeditbox-jquery.min.js"></script>
<script>
  $('#amount').fabeditbox({
    editor: 'number',
    precision: 2,
    thousandsSeparator: true
  });
</script>
```

## ES module

```js
import $ from 'jquery';
import fabui from './fabui.esm.js';
import { createFabEditBoxJQuery } from './fabeditbox-jquery.esm.js';

createFabEditBoxJQuery($, fabui);
```

## EasyUI 風格宣告

Wrapper 支援 `.fab-editbox`、`data-options` 與 inline width／height：

```html
<input
  id="tb"
  class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search'"
  style="width:300px"
>
```

以下三種寬度寫法等效且都受支援：

```html
<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search'"
  style="width:300px">

<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search',width:300">

<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search',width:'300px'">
```

Browser global wrapper 會在 DOM ready 時自動解析 `.fab-editbox`。也可手動解析動態加入的內容：

```js
fabuiEditBoxJQuery.parse(document);
fabuiEditBoxJQuery.parse(document.querySelector('#dynamic-form'));
```

為了相容既有標記，parser 也接受 `.fab-textbox`、`.fab-numberbox`、`.fab-datebox`、`.fab-combobox` 與 `.fab-colorbox`；新頁面建議統一使用 `.fab-editbox` 並在 `data-options` 指定簡化後的 `editor` 名稱。

`data-options` 支援字串、數字、boolean、`null`、Array 與純物件；為避免執行任意程式碼，不解析 function。事件 callback 請使用 jQuery `.on()` 或程式式 options。

EasyUI 風格的 `iconCls` 會轉成 `fabui.EditBox` 的單一 `icons` descriptor；`iconAlign:'left'` 可將 icon 放到左側。若同時傳入 JavaScript options，程式式設定優先：

```js
$('#tb').fabeditbox({
  iconCls: 'icon-man',
  iconAlign: 'left'
});
```

## Instance、方法與 chain

```js
var instance = $('#amount').fabeditbox('instance');

$('#amount').fabeditbox('setValue', 1280.5);
$('#amount').fabeditbox('disable');
$('#amount').fabeditbox('enable');

var value = $('#amount').fabeditbox('getValue');
```

初始化、option setter、`destroy` 與回傳 `fabui.EditBox` instance 的 setter methods 會回傳原 jQuery collection，可繼續串接。Getter methods 回傳實際結果。

## Option

```js
var editor = $('#amount').fabeditbox('option', 'editor');

$('#amount').fabeditbox('option', 'width', 280);
$('#amount').fabeditbox('option', {
  precision: 2,
  prefix: '$'
});
```

`fabui.EditBox` 的 editor 類型與大部分結構 options 無法安全地原地切換，因此 wrapper 更新 option 時會合併既有 options 並重建該控件。新的 instance 可再次由 `fabeditbox('instance')` 取得。

## Events

`fabui.EditBox` events 轉成小寫 jQuery event，namespace 固定為 `.fabeditbox`：

```js
$('#amount').on('change.fabeditbox', function(event, detail, instance) {
  console.log(detail.value, detail.oldValue);
});
```

目前轉接 `change`、`resize`、`iconclick`、`buttonclick`、`select`、`unselect`、`click`、`loadsuccess`、`loaderror`、`showpanel` 與 `hidepanel`。

Lifecycle events：

- `initialized.fabeditbox`
- `destroyed.fabeditbox`

## 銷毀

```js
$('#amount').fabeditbox('destroy');
```

`destroy` 會解除 wrapper event listeners、呼叫 `fabui.EditBox.dispose()`，並清除 element 上保存的 instance。
