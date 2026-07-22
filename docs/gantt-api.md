# `fabui.Gantt` API 操作手冊

`fabui.Gantt` 是 pure JavaScript 專案排程元件，使用左側階層任務清單與右側時間軸顯示任務、進度、里程碑及相依關係。它參考 Kendo UI Gantt 的資訊架構與操作規格重新設計，不依賴或載入 Kendo UI、jQuery。

## 載入順序

Gantt 不包含在 `fabui.*` core bundle。Browser global 必須先載入 FabUI core，再載入獨立 Gantt CSS／JavaScript：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.gantt.css">

<div id="gantt"></div>

<script src="./dist/fabui.js"></script>
<script src="./dist/fabui.gantt.js"></script>
<script>
  var gantt = new fabui.Gantt('#gantt', {
    dataSource: tasks,
    dependencies: dependencies,
    view: 'week'
  });
</script>
```

若先載入 `fabui.gantt.js`，bundle 會拋出清楚的 core dependency 錯誤。

## 發佈檔

執行 `npm run build:gantt` 只會產生以下 Gantt 檔案：

- `dist/fabui.gantt.js`
- `dist/fabui.gantt.min.js`
- `dist/fabui.gantt.css`
- `dist/fabui.gantt.min.css`

core 的 `dist/fabui.*` 不包含 `Gantt` source 或 `.fui-gantt` styles。

`npm run build` 不會建立或改寫 Gantt；`npm run build:all` 才會連同其他發佈範圍一起編譯 Gantt。

## Task 資料

```js
var tasks = [
  {
    id: 1,
    parentId: null,
    orderId: 0,
    title: '產品開發',
    start: new Date(2026, 6, 1),
    end: new Date(2026, 6, 31),
    percentComplete: 0.5,
    summary: true,
    expanded: true,
    resources: ['Product Team']
  },
  {
    id: 2,
    parentId: 1,
    orderId: 0,
    title: 'UI 實作',
    start: new Date(2026, 6, 3),
    end: new Date(2026, 6, 12),
    percentComplete: 0.75
  },
  {
    id: 3,
    parentId: 1,
    orderId: 1,
    title: 'Release',
    start: new Date(2026, 6, 31, 12),
    end: new Date(2026, 6, 31, 12),
    milestone: true
  }
];
```

| 欄位 | 說明 |
| --- | --- |
| `id` | Task 唯一識別值。 |
| `parentId` | 父 Task ID；`null` 表示根層。 |
| `orderId` | 同層排序值。 |
| `title` | 任務標題。 |
| `start`／`end` | `Date` 或可解析日期值。 |
| `percentComplete` | `0` 到 `1`；傳入 `0` 到 `100` 也會正規化。 |
| `summary` | 是否為摘要任務。 |
| `expanded` | 階層是否展開。 |
| `milestone` | 是否為里程碑；開始與結束相同時也會自動判定。 |
| `resources` | 顯示於 Task bar 右側的文字陣列。 |

## Dependency 資料

```js
var dependencies = [
  {
    id: 1,
    predecessorId: 2,
    successorId: 3,
    type: 'FS'
  }
];
```

`type` 支援 `FS`、`FF`、`SS`、`SF`；相容數字 `0` 到 `3`。元件以 SVG path 顯示相依線與終點箭頭。

## 建構選項

| 選項 | 預設值 | 說明 |
| --- | --- | --- |
| `dataSource` | `[]` | Task array。 |
| `dependencies` | `[]` | Dependency array。 |
| `columns` | Task、Start、End、Complete | 左側清單欄位。 |
| `view` | `'week'` | `'day'`、`'week'`、`'month'`、`'year'`。 |
| `views` | 四種內建 View | 工具列可切換的 View 清單。 |
| `date` | `null` | 初始焦點日期。 |
| `rangeStart`／`rangeEnd` | `null` | 明確指定 Timeline 範圍。 |
| `height` | `620` | 內容高度。 |
| `listWidth` | `540` | 左側 Task list 寬度。 |
| `minListWidth` | `260` | Splitter 最小寬度。 |
| `rowHeight` | `38` | Task row 高度。 |
| `editable` | `true` | 允許新增、Dialog 編輯、拖曳、縮放與進度調整。 |
| `showToolbar` | `true` | 顯示新增與 View 工具列。 |
| `showDependencies` | `true` | 顯示相依線。 |
| `currentTimeMarker` | `true` | 範圍內顯示目前時間線。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`，含中文別名正規化。 |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `ariaLabel` | `''` | 覆寫 Gantt host 的 accessible name。 |

## 方法

| 方法 | 說明 |
| --- | --- |
| `refresh()` | 重新計算階層、Timeline 與相依線。 |
| `getTask(id)` | 取得 Task。 |
| `getDataSource()`／`setDataSource(data)` | 讀寫 Task array。 |
| `getDependencies()`／`setDependencies(data)` | 讀寫 Dependency array。 |
| `addTask(task, parentId?)` | 新增並回傳正規化 Task。 |
| `updateTask(id, changes)` | 更新 Task 並觸發 `Update`。 |
| `removeTask(id)` | 移除 Task、子 Task 及相關相依線。 |
| `select(id)`／`clearSelection()` | 設定或清除選取。 |
| `getView()`／`setView(view)` | 讀寫 Timeline View。 |
| `range()` | 取得目前 `{ start, end }`。 |
| `scrollToDate(date)` | 將日期捲動到 Timeline 中央。 |
| `expand(id)`／`collapse(id)` | 展開或收合 Task。 |
| `expandAll()`／`collapseAll()` | 展開或收合全部階層。 |
| `setListWidth(width)` | 設定左側清單寬度。 |
| `setTheme(theme)`／`setLocale(locale)` | 更新相容 theme 狀態或語系；`setTheme()` 不切換 CSS。 |
| `editTask(idOrTask)` | 開啟重用 `fabui.Window`、`fabui.EditBox`、`fabui.Button` 的編輯視窗。 |
| `on(name, handler)`／`off(name, handler)` | 訂閱或解除元件事件。 |
| `dispose()` | 解除 listener、子控件、editor Window 與 Control registry。 |

## 事件

建構選項可使用 `onAdd`、`onUpdate`、`onRemove`、`onChange`、`onResize`、`onViewChange`、`onDataBound`。也可用小寫事件名稱訂閱：

```js
gantt.on('update', function(args) {
  console.log(args.task, args.action);
});
```

Task bar 的 `action` 可能是 `move`、`start`、`end`、`progress` 或 `api`。Pointer interaction 只在操作期間綁定 document listener；`pointercancel` 會放棄預覽。

## 鍵盤與無障礙

- Gantt host 使用 `role="application"`，Task bar 使用 `treeitem`。
- `ArrowUp`／`ArrowDown` 切換選取。
- `ArrowLeft`／`ArrowRight` 收合或展開目前 Task。
- `Enter` 開啟編輯視窗。
- 可編輯模式下 `Delete`／`Backspace` 移除目前 Task。
- Splitter 可用 `ArrowLeft`／`ArrowRight` 調整寬度。
- Toolbar、Edit Dialog 與輸入欄位直接重用 FabUI 公開元件。
