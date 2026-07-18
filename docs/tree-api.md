# fabui.Tree API 操作手冊

`fabui.Tree` 是 pure JavaScript 階層清單，API 與視覺參考 jQuery EasyUI Tree／Default theme，但不依賴 jQuery 或 EasyUI runtime。

## 建立 Tree

### JavaScript 資料

```html
<div id="tree"></div>
<script>
  var tree = new fabui.Tree('#tree', {
    animate: true,
    lines: true,
    checkbox: true,
    data: [{
      id: 'documents',
      text: '我的文件',
      state: 'open',
      children: [{
        id: 'photos',
        text: '相片',
        state: 'closed',
        children: [
          { id: 'friends', text: '朋友' },
          { id: 'family', text: '家人' }
        ]
      }]
    }]
  });
</script>
```

### 巢狀 markup

```html
<ul id="tree">
  <li data-id="documents">
    <span>我的文件</span>
    <ul>
      <li data-id="photos" data-state="closed">相片</li>
      <li>README.md</li>
    </ul>
  </li>
</ul>
<script>
  var tree = new fabui.Tree('#tree', { animate: true });
</script>
```

同一個 host 重複建立時會回傳既有 instance。也可用 `fabui.Tree.getControl(element)` 或 `fabui.Control.getControl(element)` 取得 instance。

## Node 資料

| 欄位 | 類型 | 說明 |
| --- | --- | --- |
| `id` | `string \| number` | 節點識別值；未提供時自動產生。 |
| `text` | `string` | 節點顯示文字。 |
| `state` | `'open' \| 'closed'` | 節點展開狀態，預設 `open`。 |
| `checked` | `boolean` | checkbox 初始狀態。 |
| `iconCls` | `string` | 自訂圖示 class，統一使用 `icon-xxx`。 |
| `attributes` | `object` | 應用程式自訂資料。 |
| `children` | `Array<Node>` | 子節點。 |
| `target` | `HTMLElement \| null` | 目前對應的 Tree row element，由 Tree 維護。 |

遠端或自訂 loader 回傳同一種 Node 陣列。

## Options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `url` | `null` | 遠端資料 URL。 |
| `method` | `'post'` | 遠端請求方法，可用 `get`／`post`。 |
| `queryParams` | `{}` | 每次遠端載入附加的參數。 |
| `data` | `null` | 本機 Node 陣列；未提供時讀取 host markup。 |
| `animate` | `false` | 啟用節點狀態過渡效果。 |
| `checkbox` | `false` | 顯示 checkbox；也可傳入 `(node) => boolean`。 |
| `cascadeCheck` | `true` | checkbox 是否連動子孫與祖先狀態。 |
| `onlyLeafCheck` | `false` | 只在 leaf 顯示 checkbox。 |
| `lines` | `false` | 顯示階層連接線。 |
| `dnd` | `false` | 啟用節點拖放；落點為 `top`、`append`、`bottom`。 |
| `formatter` | `null` | `(node) => string \| HTMLElement`；字串視為受信任 HTML。 |
| `filter` | `null` | `(query, node) => boolean`；供 `doFilter()` 使用。 |
| `loader` | `null` | `(param, success, error)`，也可回傳 Promise。 |
| `loadFilter` | `null` | `(data, parentNode) => Node[]`，在載入後正規化回應。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `'inherit'` | 繼承外層 `fg-theme-*`，或指定 16 組內建 theme。 |
| `ariaLabel` | `''` | Tree 的無障礙名稱；空值使用 locale 文字。 |

`state: 'closed'` 且未提供 `children` 的節點視為 lazy node。第一次展開會呼叫 loader，參數包含該節點的 `id`。

## Methods

| Method | 說明 |
| --- | --- |
| `options()` | 取得目前 options。 |
| `setOptions(options)` | 更新 options、theme 與呈現。 |
| `loadData(data)` | 以 Node 陣列取代全部資料。 |
| `reload(target?)` | 重新載入根資料或指定 lazy node，回傳 Promise。 |
| `getNode(targetElement)` | 由 Tree row 或其子 element 取得 Node。 |
| `getData(target)` | 取得指定 Node。 |
| `getRoot()`／`getRoots()` | 取得第一個 root 或全部 roots。 |
| `getParent(target)` | 取得父節點。 |
| `getChildren(target?)` | 取得指定節點的所有子孫；不傳 target 取得全部節點。 |
| `getChecked(state?)` | 取得 `checked`、`unchecked`、`indeterminate`／`mixed` 節點。 |
| `getSelected()` | 取得目前選取節點。 |
| `isLeaf(target)` | 判斷是否為已載入的 leaf。 |
| `find(id)` | 依 `id` 尋找節點。 |
| `findBy(field, value)` | 依自訂欄位尋找第一個節點。 |
| `select(target)` | 選取節點。 |
| `check(target)`／`uncheck(target)` | 勾選或取消勾選。 |
| `expand(target)`／`collapse(target)`／`toggle(target)` | 展開、收合或切換節點。 |
| `expandAll(target?)`／`collapseAll(target?)` | 操作指定子樹或整棵樹。 |
| `expandTo(target)` | 展開指定節點的所有祖先。 |
| `scrollTo(target)` | 展開路徑並捲動至指定節點。 |
| `append({ parent, data })` | 在父節點或 root 尾端加入節點陣列。 |
| `insert({ before, data })`／`insert({ after, data })` | 插入單一節點。 |
| `remove(target)` | 移除節點與其子樹。 |
| `pop(target)` | 移除節點並回傳不含內部欄位的資料快照。 |
| `update({ target, ...fields })` | 更新節點；可包含新的 `children`。 |
| `enableDnd()`／`disableDnd()` | 動態切換拖放。 |
| `beginEdit(target)`／`endEdit(target)`／`cancelEdit(target)` | 控制 inline 文字編輯。 |
| `doFilter(query)` | 篩選節點並保留符合結果的祖先路徑。空字串顯示全部節點。 |
| `setLocale(locale, messages?)` | 切換語系或註冊單次自訂文字。 |
| `setTheme(theme)` | 切換 theme；傳入 `inherit` 重新繼承外層。 |
| `render()` | 依目前資料重繪。 |
| `destroy()` | 解除 listener、registry 並完整還原原始 host。 |

## Events

建構 options 可使用 EasyUI 風格 callback；`tree.on(type, listener)` 也會收到對應事件。

| Callback | 參數 |
| --- | --- |
| `onClick`／`onDblClick` | `(node)` |
| `onBeforeSelect`／`onSelect` | `(node)` |
| `onBeforeExpand`／`onExpand` | `(node)` |
| `onBeforeCollapse`／`onCollapse` | `(node)` |
| `onBeforeCheck`／`onCheck` | `(node, checked)` |
| `onBeforeLoad` | `(parentNode, param)` |
| `onLoadSuccess` | `(parentNode, data)` |
| `onLoadError` | `(error, parentNode)` |
| `onContextMenu` | `(originalEvent, node)` |
| `onBeforeDrag`／`onStartDrag`／`onStopDrag` | `(node)` |
| `onDragEnter`／`onDragOver`／`onDragLeave` | `(targetNode, sourceNode)` |
| `onBeforeDrop`／`onDrop` | `(targetNode, sourceNode, point)` |
| `onBeforeEdit`／`onAfterEdit`／`onCancelEdit` | `(node)` |

名稱以 `onBefore...` 開頭的 callback 回傳 `false` 可取消操作。使用 `on()` 訂閱時，可在 before event 呼叫 `event.preventDefault()`。

## 鍵盤與無障礙

- `ArrowUp`／`ArrowDown`：移動目前節點。
- `ArrowLeft`：收合節點，已收合時移到父節點。
- `ArrowRight`：展開節點，已展開時移到第一個子節點。
- `Home`／`End`：移到第一個／最後一個可見節點。
- `Enter`：選取節點。
- `Space`：切換 checkbox。
- `F2`：開始編輯；編輯中用 `Enter` 提交、`Escape` 取消。

Tree 使用 `tree`／`treeitem`／`group` role，並同步 `aria-expanded`、`aria-selected`、`aria-checked` 與節點層級。

## Demo

- Source-mode：[demo/dev-tree.html](../demo/dev-tree.html)
- Build-mode：[demo/tree.html](../demo/tree.html)
