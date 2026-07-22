# `fabui.Scheduler` API 操作手冊

`fabui.Scheduler` 是 FabUI 的獨立 pure JavaScript 排程附加元件。版面與常用操作參考 Telerik Kendo UI Scheduler，但 DOM、渲染、事件與資料處理均為 FabUI 自有實作，沒有 jQuery 或 Kendo runtime 依賴。

## 載入順序

Scheduler 不在原本的 `fabui.*` core bundle 內。Browser global 必須依序載入 FabUI core，再載入 Scheduler：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.scheduler.css">
<div id="scheduler"></div>
<script src="./dist/fabui.min.js"></script>
<script src="./dist/fabui.scheduler.min.js"></script>
<script>
  var scheduler = new fabui.Scheduler('#scheduler', {
    date: new Date(2026, 6, 20),
    currentView: 'workWeek',
    dataSource: []
  });
</script>
```

若先載入 `fabui.scheduler.*`，元件會直接回報必須先載入 FabUI core，不會建立第二份 `fabui` namespace。

## 獨立輸出

執行 `npm run build:scheduler` 會產生：

```text
dist/fabui.scheduler.js
dist/fabui.scheduler.min.js
dist/fabui.scheduler.css
dist/fabui.scheduler.min.css
```

`npm run build` 仍只產生 FabUI core；`dist/fabui.*` 不包含 Scheduler。

## 建構子

```js
var scheduler = new fabui.Scheduler(elementOrSelector, options);
```

Scheduler 繼承 `fabui.Control`，建立時登記 Control registry，`dispose()` 時解除。

## Views

| View | 說明 |
| --- | --- |
| `day` | 單日時間格 |
| `workWeek` | 星期一至星期五 |
| `week` | 完整七日 |
| `month` | 六週月曆 |
| `year` | 十二個月份縮圖 |
| `agenda` | 七日行程清單 |
| `timeline` | 單日水平時間軸，可依第一組 resource 分列 |

`views` 可傳字串或設定物件：

```js
views: [
  'day',
  { type: 'workWeek', selected: true },
  'month',
  'agenda'
]
```

## 主要 options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `width` | `'100%'` | host 寬度 |
| `height` | `600` | host 高度 |
| `date` | `new Date()` | 目前顯示日期 |
| `currentView` | `'workWeek'` | 初始 view |
| `views` | 七種內建 view | 工具列顯示的 view |
| `dataSource` | `[]` | 本機行程陣列 |
| `resources` | `[]` | 行程資源定義 |
| `editable` | `true` | 是否允許新增、編輯、刪除、拖曳與調整時間 |
| `selectable` | `true` | 是否允許選取行程 |
| `firstDay` | `0` | 一週首日；`0` 為星期日，`1` 為星期一 |
| `startTime` | `'07:00'` | 時間格開始時間 |
| `endTime` | `'24:00'` | 時間格結束時間 |
| `scrollTime` | `'08:00'` | 時間格初次捲動位置 |
| `workDayStart`／`workDayEnd` | `'08:00'`／`'17:00'` | 保留的工作時段 metadata；目前不改變時間格顯示 |
| `slotDuration` | `30` | 每格分鐘數 |
| `slotHeight` | `34` | 每格高度 px |
| `monthEventLimit` | `3` | Month 每日直接顯示的最大行程數 |
| `eventColor` | `'#2572c0'` | 沒有 resource color 時的預設色 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN` |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定 |
| `messages` | `null` | 覆寫目前 locale 訊息 |

## Event 資料

```js
{
  id: 1,
  title: '產品週會',
  description: '確認交付進度',
  start: new Date(2026, 6, 20, 9, 0),
  end: new Date(2026, 6, 20, 10, 30),
  isAllDay: false,
  roomId: 1,
  color: '#2572c0'
}
```

`id`、`title`、`description`、`start`、`end`、`isAllDay`、`color` 是內建欄位；其他自訂欄位原樣保留。`addEvent()` 未傳入 id 時會自動產生數字 id。本機 CRUD 直接更新傳入的 `dataSource` 陣列及行程物件。

## Resources

```js
resources: [
  {
    field: 'roomId',
    title: '會議室',
    dataSource: [
      { text: '海洋會議室', value: 1, color: '#2572c0' },
      { text: '森林會議室', value: 2, color: '#2f8f63' }
    ]
  }
]
```

Resource color 會套用到對應行程；Timeline 使用第一組 resource 建立分列。編輯視窗會為每組 resource 建立重用 `fabui.EditBox` Combo 的欄位。

## 使用者操作

- 工具列提供今天、前一個、下一個與 view 切換。
- 雙擊空白時間格新增行程；雙擊行程開啟編輯視窗。
- Day／Work Week／Week／Timeline 可拖曳行程並由下緣或右緣 handle 調整結束時間。
- `Delete`／`Backspace` 刪除目前選取行程，`Enter` 編輯。
- `Alt + ←`／`Alt + →` 切換前後日期範圍。
- 編輯器重用 `fabui.Window`、`fabui.EditBox`、`fabui.CheckBox` 與 `fabui.Button`。

拖曳期間才綁定 document pointer listener；pointer up、pointer cancel 或 `dispose()` 立即解除。`pointercancel` 不提交變更。

## 方法

| 方法 | 回傳 | 說明 |
| --- | --- | --- |
| `date()` / `date(value)` | Date / Scheduler | 取得或設定目前日期 |
| `view()` / `view(type)` | string / Scheduler | 取得或切換 view |
| `navigate(action)` | Scheduler | `previous`、`next` 或 `today` |
| `refresh()` | Scheduler | 重繪目前 view |
| `resize(width?, height?)` | Scheduler | 更新 host 尺寸 |
| `dataSource()` / `dataSource(array)` | Array / Scheduler | 取得或更換資料 |
| `selection()` | Object / `null` | 取得目前選取行程 |
| `select(index)` | Scheduler | 依陣列 index 選取 |
| `addEvent(event)` | Object / `null` | 新增行程 |
| `updateEvent(indexOrEvent, values)` | Object / `null` | 更新行程 |
| `removeEvent(indexOrEvent)` | Object / `null` | 刪除行程 |
| `openEditor(indexOrDefaults)` | Window / `null` | 開啟新增或編輯視窗 |
| `setOptions(options)` | Scheduler | 更新 options 並重繪 |
| `setLocale(locale, messages?)` | Scheduler | 切換語系 |
| `setTheme(theme)` | Scheduler | 更新相容 theme 狀態，不切換 CSS |
| `on(name, listener)` / `off(name, listener?)` | Scheduler | 訂閱或解除事件 |
| `dispose()` / `destroy()` | `void` | 還原 host 並解除 listener |

## 事件

Options callback 使用 `onNavigate`、`onChange` 等名稱；也可以使用 `on('navigate', listener)`。

| 事件 | 可取消 | 說明 |
| --- | --- | --- |
| `Navigate` | 是 | 日期或 view 切換前 |
| `Change` | 否 | 選取行程 |
| `DataBinding` | 是 | 重繪前 |
| `DataBound` | 否 | 重繪完成 |
| `Save` | 是 | 新增或更新提交前 |
| `Create` | 否 | 新行程已加入 |
| `Remove` | 是 | 刪除前 |
| `Cancel` | 否 | 編輯器取消 |
| `Move` | 是 | 拖曳提交前 |
| `Resize` | 是 | 使用者拖曳調整行程時間提交前 |

可取消事件的 callback 或 listener 回傳 `false` 即停止預設提交。

## Metadata

```js
fabui.Scheduler.themes;
fabui.Scheduler.locales;
fabui.Scheduler.views;
fabui.Scheduler.normalizeLocale('zh_Hant_TW'); // 'zh-TW'
fabui.Scheduler.normalizeLocale('zh-Hans');    // 'zh-CN'
```

Scheduler 公開與其他 FabUI 元件相同的 19 組 theme metadata。實際配色由頁面最後載入的 Theme CSS 決定。
