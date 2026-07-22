# fabui.PropertyGrid API 操作手冊

`fabui.PropertyGrid` 是 FabUI core 內建的 pure JavaScript 屬性編輯表。API 與 Default 視覺參考 jQuery EasyUI PropertyGrid，但不依賴 jQuery 或 EasyUI runtime；文字、數字、日期、清單與顏色欄位直接重用 `fabui.EditBox`。

## 建立

```html
<div id="properties"></div>
<script>
  var propertyGrid = new fabui.PropertyGrid('#properties', {
    width: 420,
    showGroup: true,
    data: [{
      name: 'Name',
      value: 'Bill Smith',
      group: 'ID Settings',
      editor: 'text'
    }, {
      name: 'Age',
      value: 40,
      group: 'ID Settings',
      editor: {
        type: 'number',
        options: { min: 0, max: 120 }
      }
    }]
  });
</script>
```

同一個 host 重複建立時會回傳既有 instance。也可用 `fabui.PropertyGrid.getControl(host)` 或 `fabui.Control.getControl(host)` 取得 instance。

## 資料格式

可傳入 row array，或 DataGrid 相容的 `{ total, rows }`：

| 欄位 | 說明 |
| --- | --- |
| `name` | 屬性名稱；可由 `nameField` 改名。 |
| `value` | 屬性值；可由 `valueField` 改名。 |
| `group` | 群組名稱；可由 `groupField` 改名。 |
| `editor` | editor 名稱，或 `{ type, options }`。省略時為唯讀列。 |

Editor 支援 `text`、`number`、`date`、`combo`、`color`、`boolean`；舊名 `textbox`、`numberbox`、`datebox`、`combobox`、`colorbox`、`checkbox` 會自動轉成公開名稱。

## Options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `width`／`height` | `'auto'` | 元件尺寸，接受 number 或 CSS size。 |
| `fit` | `false` | 填滿 host 可用空間。 |
| `border` | `true` | 顯示外框。 |
| `showHeader` | `true` | 顯示 Name／Value 標題列。 |
| `showGroup` | `false` | 依 `groupField` 顯示可收合群組。 |
| `groupField` | `'group'` | 群組欄位。 |
| `nameField`／`valueField` | `'name'`／`'value'` | 名稱與值欄位。 |
| `rowHeight` | `28` | 資料列高度，最小 24px。 |
| `striped` | `false` | 交替列背景。 |
| `editable` | `true` | 是否允許進入 row editor。 |
| `columns` | `null` | 兩欄設定；相容 EasyUI 的 `[[column, column]]`。 |
| `data` | `[]` | 本機 row array 或 `{ total, rows }`。 |
| `url`／`method`／`queryParams` | `null`／`'get'`／`{}` | 遠端 JSON 載入設定。 |
| `loader(params)` | `null` | 回傳資料或 Promise 的自訂 loader。 |
| `loadFilter(data)` | `null` | 資料進入元件前的轉換函式。 |
| `groupFormatter(group, rows)` | `null` | 回傳群組列 HTML；第二參數是該群組 rows。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `ariaLabel` | `''` | 覆寫 PropertyGrid host 的 accessible name。 |

Column 支援 `field`、`title`、`width`、`align`、`sortable`、`resizable`、`formatter(value, row, index)` 與 `styler(value, row, index)`。`formatter` 回傳值會視為 HTML。

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 options 副本。 |
| `loadData(data)`／`reload(params?)` | 載入本機／遠端資料。 |
| `getRows()`／`getSelected()`／`selectRow(index)` | 取得與變更目前資料／選取列。 |
| `beginEdit(index)`／`endEdit(index?)`／`cancelEdit(index?)` | 控制 inline editor。 |
| `validateRow(index?)`／`getEditor(index?)` | 驗證或取得目前 editor。 |
| `appendRow(row)`／`insertRow({ index, row })` | 新增資料列。 |
| `updateRow({ index, row })`／`deleteRow(index)`／`refreshRow(index)` | 更新、刪除或重畫資料列。 |
| `getChanges(type?)` | 取得 `inserted`、`updated`、`deleted` 或全部異動。 |
| `acceptChanges()`／`rejectChanges()` | 接受目前版本或還原到最近接受版本。 |
| `groups()` | 取得 `{ value, rows, startIndex, collapsed }` 群組陣列。 |
| `expandGroup(index?)`／`collapseGroup(index?)` | 展開／收合指定群組；省略 index 時套用全部。 |
| `showGroup()`／`hideGroup()` | 顯示／隱藏群組列。 |
| `showHeader()`／`hideHeader()` | 顯示／隱藏標題列。 |
| `setOptions(options)`／`resize(width?, height?)` | 更新設定或尺寸。 |
| `setLocale(locale, messages?)`／`setTheme(theme)` | 更新語系或相容 theme 狀態；`setTheme()` 不切換 CSS。 |
| `destroy()`／`dispose()` | 移除 listener、Control registry 與 editor，還原原始 host。 |

## Events

每個 `onXxx` option 都有對應的小寫 native emitter event，可用 `propertyGrid.on(name, listener)`／`off()` 監聽。

- 載入：`onBeforeLoad`、`onLoadSuccess`、`onLoadError`
- 選取：`onBeforeSelect`、`onSelect`、`onUnselect`
- 滑鼠：`onClickRow`、`onDblClickRow`、`onClickCell`、`onDblClickCell`
- 編輯：`onBeforeEdit`、`onBeginEdit`、`onAfterEdit`、`onCancelEdit`、`onChange`
- 群組與排序 emitter：`groupexpand`、`groupcollapse`、`sort`

`onBeforeLoad`、`onBeforeSelect`、`onBeforeEdit` 回傳 `false` 可取消操作；對應 native event 也可呼叫 `preventDefault()`。

## 鍵盤與可及性

- `↑`／`↓`：移動選取列。
- `Enter`：開始或提交編輯。
- `Escape`：取消目前編輯。
- 群組按鈕提供 `aria-expanded`，host 使用 `role="grid"`，列與儲存格提供對應 ARIA role。

Source-mode Demo：[`demo/dev-propertygrid.html`](../demo/dev-propertygrid.html)
Build-mode Demo：[`demo/propertygrid.html`](../demo/propertygrid.html)
