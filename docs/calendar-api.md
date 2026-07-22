# fabui.Calendar API

`fabui.Calendar` 是 FabUI core 內建的 pure JavaScript 月曆元件。API 與 Default 視覺參考 jQuery EasyUI Calendar，但不依賴 jQuery 或 EasyUI runtime。它和 Date EditBox、FabGrid 日期 editor 共用同一個 `DatePopup` 日曆 renderer、月份選單、日期驗證、農民曆與 19 組 theme 樣式。

## 建立 Calendar

```html
<div id="calendar"></div>

<script>
  var calendar = new fabui.Calendar('#calendar', {
    locale: 'zh-TW',
    onSelect: function(date) {
      console.log(date);
    }
  });
</script>
```

預設尺寸為 `180 × 180`，一週從星期日開始，週次與農民曆均不顯示。`showLunar` 必須明確設為 `true` 才會在國曆日期下方顯示農曆。

## Options

| Option | 預設值 | 說明 |
| --- | --- | --- |
| `width` / `height` | `180` / `180` | 數字使用 px，也可傳 CSS 尺寸字串。 |
| `fit` | `false` | 設為 `true` 時填滿父容器。 |
| `border` | `true` | 是否顯示外框。 |
| `showWeek` | `false` | 是否顯示週次欄。 |
| `weekNumberHeader` | `''` | 週次欄標題。 |
| `getWeekNumber(date)` | ISO week | 自訂週次計算。 |
| `firstDay` | `0` | 每週第一天，`0` 到 `6` 代表星期日至星期六。 |
| `weeks` | locale pack | 七個星期標題。 |
| `months` | locale pack | 十二個月份名稱。 |
| `year` / `month` | 目前年月 | 初始顯示年月；`month` 為 `1` 到 `12`。 |
| `current` | 今天 | 目前選取日期。 |
| `formatter(date)` | 日期數字 | 自訂日期格顯示文字。 |
| `styler(date)` | `''` | 回傳 CSS 字串，或 `{ class, style }`。 |
| `validator(date)` | 永遠有效 | 回傳 `false` 會停用該日期。 |
| `showLunar` | `false` | 顯示農民曆日期。 |
| `locale` | `'en'` | `en`、`zh-TW` 或 `zh-CN`。 |
| `theme` | `'inherit'` | 相容用 theme metadata；實際配色由外部 Theme CSS 決定。 |
| `cls` | `''` | 加到 Calendar 內層 panel 的自訂 class。 |
| `ariaLabel` | `null` | 覆寫 Calendar 的 accessible name。 |
| `yearText` | locale pack | 年份選單按鈕的 accessible name。 |
| `previousYearText`／`nextYearText` | locale pack | 上一年／下一年按鈕文字。 |
| `previousMonthText`／`nextMonthText` | locale pack | 上一月／下一月按鈕文字。 |
| `onSelect(date)` | `null` | 使用者或 `select()` 選取日期後觸發。 |
| `onChange(newDate, oldDate)` | `null` | 選取日期實際變更後觸發。 |
| `onNavigate(year, month)` | `null` | 顯示年月完成更新後觸發。 |
| `onResize(calendar, args)` | `null` | `resize()` 完成後觸發。 |

`formatter` 的回傳值以文字輸出，不會執行 HTML。`styler` 的 class 套在日期格 `td`，style 可使用 CSS 字串或 style object。

## Properties

| Property | 說明 |
| --- | --- |
| `hostElement` | 建立 Calendar 的 host element。 |
| `calendarElement` | 共用 DatePopup 建立的 `.fui-calendar` element。 |
| `options` | 目前完整 options。 |
| `theme` | 正規化後的 theme 名稱。 |

## Methods

| Method | 說明 |
| --- | --- |
| `calendar()` | 取得 `.fui-calendar` element。 |
| `resize({ width, height })` | 動態調整尺寸；省略參數時依目前 options 重算。 |
| `moveTo(date)` | 更新選取日期與顯示年月；日期變更時觸發 `change`。傳入 `null` 會清除選取並移到今天。 |
| `select(date)` | 選取有效日期，觸發 `select`，實際變更時再觸發 `change`。 |
| `refresh()` | 依目前 options 重新繪製。 |
| `setOptions(options)` | 更新 options 並重繪。 |
| `setTheme(theme)` | 更新相容 theme 狀態，不載入或切換 CSS。 |
| `setLocale(locale, messages?)` | 切換三語系，可覆寫語系文字。 |
| `on(name, listener)` / `off(name, listener?)` | 訂閱或解除 `select`、`change`、`navigate`、`resize`。 |
| `destroy()` / `dispose()` | 移除事件與 DOM，還原原始 host。 |

所有 setter 與操作 methods 都回傳 Calendar instance。Calendar 建立後也可用 `fabui.Control.getControl(host)` 或 `fabui.Calendar.getControl(host)` 取得 instance。

## 農民曆

```js
var lunarCalendar = new fabui.Calendar('#lunarCalendar', {
  width: 482,
  height: 500,
  locale: 'zh-TW',
  showLunar: true
});
```

農民曆使用瀏覽器 `Intl.DateTimeFormat` 的 Chinese calendar 支援；若執行環境不支援，國曆仍會正常顯示，農曆文字則保持空白。
