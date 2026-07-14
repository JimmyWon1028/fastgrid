# FabGrid Vue 2 Wrapper API

`fabgrid-vue` 是 FabGrid pure JavaScript core 的 Vue 2 Options API wrapper。Wrapper 只管理 component lifecycle、props 與 events；cell rendering、virtualization、sorting、editing 與 selection 仍由 FabGrid core 執行。

完整 Vue 2 Options API 單檔元件範例請參考 [`demo/js/demo-vue2.vue`](../demo/js/demo-vue2.vue)。

此 Vue Demo 與 `demo/dev.html` 使用相同資料規模、工具列設定、欄位 editor、theme、locale、群組、篩選、remote、Popup Grid、匯出與 runtime stats；Vue wrapper 不接管 cell rendering。

開發期間使用靜態伺服器與 SystemJS runtime loader：

```bash
npm run dev:vue
```

開啟 `http://127.0.0.1:4174/demo/demo-vue2.html`。此頁依序載入 `dist/wrapper/vue.min.js`、`dist/fabui.min.js` 與 `dist/wrapper/fabgrid-vue.min.js` browser global，再載入 `demo/js/vue2-systemjs.config.js`，由 `System.import()` 於瀏覽器執行期間動態取得並轉譯 `demo/js/demo-vue2.vue`；每次重新整理都會使用 cache-busting URL。修改 `.vue` 後重新整理瀏覽器即可看到結果。

SystemJS runtime loader 只用於本機 source-mode Demo；目前不提供獨立 Vue production HTML 頁面。

大型唯讀資料可使用 `Object.freeze(rows)` 避免 Vue 2 對每個 row 與欄位建立深層 observer；更新時替換整個 frozen array reference。

## 安裝

Browser global 依序載入 Vue、FabUI 與 wrapper：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<script src="https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.min.js"></script>
<script src="./dist/fabui.min.js"></script>
<script src="./dist/wrapper/fabgrid-vue.min.js"></script>
```

Browser bundle 會自動執行 `Vue.use(fabuiVue)`。

## FabGrid props

| Prop | 型別 | 說明 |
| --- | --- | --- |
| `itemsSource` | `Array` | Grid 資料來源；wrapper 不複製陣列。 |
| `columns` | `Array` | 欄位定義；提供後優先於 `FabGridColumn`。 |
| `gridOptions` | `Object` | 傳給 core 的進階完整 options。 |
| `allowEditing` | `Boolean` | 是否允許編輯。 |
| `allowSorting` | `Boolean` | 是否允許排序。 |
| `allowResizing` | `Boolean` | 是否允許調整欄寬。 |
| `activeCellBorder` | `Number` | Active cell 與 cell editor 邊框寬度，單位為 px。 |
| `frozenColumns` | `Number` | 左側凍結欄數。 |
| `frozenRightColumns` | `Number` | 右側凍結欄數。 |
| `isReadOnly` | `Boolean` | 唯讀模式。 |
| `locale` | `String` | Grid locale。 |
| `pagination` | `Boolean\|Object` | 分頁設定。 |
| `pager` | `Object` | Pager 設定。 |
| `remote` | `Boolean` | 是否使用遠端資料模式。 |
| `url` | `String` | 遠端資料 URL。 |
| `method` | `String` | `GET` 或 `POST`。 |
| `loader` | `Function` | 自訂 Promise loader。 |

## Events

| Vue event | Core event |
| --- | --- |
| `initialized` | Wrapper 建立 core control 完成。 |
| `selection-changed` | `selectionChanged` |
| `beginning-edit` | `beginningEdit` |
| `cell-edit-ending` | `cellEditEnding` |
| `cell-edit-ended` | `cellEditEnded` |
| `sorted-column` | `sortedColumn` |
| `before-load` | `beforeLoad` |
| `load-success` | `loadSuccess` |
| `load-error` | `loadError` |
| `items-source-changed` | `itemsSourceChanged` |
| `loaded-rows` | `loadedRows` |

## Component ref

Vue component ref 公開：

| 名稱 | 說明 |
| --- | --- |
| `control` | 底層 `fabui.FabGrid` instance。 |
| `refresh()` | 立即 refresh Grid。 |
| `invalidate()` | 排程重繪。 |
| `select(row, col)` | 選取 cell。 |
| `scrollIntoView(row, col)` | 捲動到指定 cell。 |

## FabGridColumn

宣告式欄位支援 `binding`、`header`、`width`、`minWidth`、`align`、`dataType`、`format`、`isReadOnly`、`visible`、`editor`、`formatter`。

若同時提供 `columns` prop 與 `FabGridColumn`，以 `columns` prop 為準。Wrapper 不提供 Vue cell slot，避免 Vue 接管大量 virtualized cells。
