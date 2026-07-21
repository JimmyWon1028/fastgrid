# Mono icon 來源

本資料夾提供與 `src/theme/images/` 現有圖檔對應的單色 SVG，原有 PNG／GIF 不會被覆蓋；整組 sprite 會拆成用途明確的獨立 SVG。

`mono`、`mono-red`、`mono-green` 是 FabUI 第 17 至 19 組公開主題，分別沿用 Metro Gray、Metro Red、Metro Green 的版面色調，並共用本資料夾的單色 SVG icon。

Build 時會將這組 SVG 另外輸出到 `dist/theme/mono/`；輸出檔名保持不變，正式版 Mono CSS 只引用這個資料夾，其他主題的共用圖片路徑不變。

- 圖示集：[Tabler Icons on Iconify](https://icon-sets.iconify.design/tabler/)
- 作者：Paweł Kuna 與 Tabler Icons contributors
- 授權：[MIT License](https://github.com/tabler/tabler-icons/blob/master/LICENSE)
- 統一顏色：`#000000`
- 一般尺寸：`16 × 16`
- 來源圖示的原始座標：`24 × 24`

## 對照表

| FabUI SVG | Tabler Icons 來源 |
| --- | --- |
| `back.svg` | [`arrow-left`](https://icon-sets.iconify.design/tabler/arrow-left/) |
| `blank.svg` | FabUI 自製透明 SVG |
| `cancel.svg` | [`circle-x`](https://icon-sets.iconify.design/tabler/circle-x/) |
| `check.svg` | [`check`](https://icon-sets.iconify.design/tabler/check/) |
| `clear.svg` | [`backspace`](https://icon-sets.iconify.design/tabler/backspace/) |
| `close.svg` | [`x`](https://icon-sets.iconify.design/tabler/x/) |
| `cut.svg` | [`cut`](https://icon-sets.iconify.design/tabler/cut/) |
| `datebox_arrow.svg` | 本機參考檔 `res/bi--calendar-date.svg`，調整為 `16 × 16` 黑色單色 SVG |
| `edit_add.svg` | [`square-plus`](https://icon-sets.iconify.design/tabler/square-plus/) |
| `edit_remove.svg` | [`trash`](https://icon-sets.iconify.design/tabler/trash/) |
| `excel.svg` | 本機參考檔 `res/griddy-icons--xls.svg`，調整為 `16 × 16` 黑色單色 SVG |
| `export.svg` | 本機參考檔 `res/mdi--export.svg`，調整為 `16 × 16` 黑色單色 SVG |
| `filesave.svg` | [`device-floppy`](https://icon-sets.iconify.design/tabler/device-floppy/) |
| `filter.svg` | [`filter`](https://icon-sets.iconify.design/tabler/filter/) |
| `fullscreen.svg` | [`maximize`](https://icon-sets.iconify.design/tabler/maximize/) |
| `help.svg` | [`help`](https://icon-sets.iconify.design/tabler/help/) |
| `import.svg` | 本機參考檔 `res/mdi--import.svg`，調整為 `16 × 16` 黑色單色 SVG |
| `loading.svg` | [`loader-2`](https://icon-sets.iconify.design/tabler/loader-2/)，加入 SVG 旋轉動畫 |
| `lock.svg` | [`lock`](https://icon-sets.iconify.design/tabler/lock/) |
| `man.svg` | [`user`](https://icon-sets.iconify.design/tabler/user/) |
| `mini_add.svg` | [`plus`](https://icon-sets.iconify.design/tabler/plus/) |
| `mini_edit.svg` | [`pencil`](https://icon-sets.iconify.design/tabler/pencil/) |
| `mini_refresh.svg` | [`refresh`](https://icon-sets.iconify.design/tabler/refresh/) |
| `more.svg` | [`dots`](https://icon-sets.iconify.design/tabler/dots/) |
| `no.svg` | [`ban`](https://icon-sets.iconify.design/tabler/ban/) |
| `ok.svg` | [`check`](https://icon-sets.iconify.design/tabler/check/) |
| `pagination-first.svg` | [`chevrons-left`](https://icon-sets.iconify.design/tabler/chevrons-left/) |
| `pagination-prev.svg` | [`chevron-left`](https://icon-sets.iconify.design/tabler/chevron-left/) |
| `pagination-next.svg` | [`chevron-right`](https://icon-sets.iconify.design/tabler/chevron-right/) |
| `pagination-last.svg` | [`chevrons-right`](https://icon-sets.iconify.design/tabler/chevrons-right/) |
| `pagination-load.svg` | [`refresh`](https://icon-sets.iconify.design/tabler/refresh/) |
| `pencil.svg` | [`pencil`](https://icon-sets.iconify.design/tabler/pencil/) |
| `print.svg` | [`printer`](https://icon-sets.iconify.design/tabler/printer/) |
| `projector-screen.svg` | [`presentation`](https://icon-sets.iconify.design/tabler/presentation/) |
| `redo.svg` | [`arrow-forward-up`](https://icon-sets.iconify.design/tabler/arrow-forward-up/) |
| `refwin.svg` | [`app-window`](https://icon-sets.iconify.design/tabler/app-window/) |
| `reload.svg` | [`refresh`](https://icon-sets.iconify.design/tabler/refresh/) |
| `row-number.svg` | [`list-numbers`](https://icon-sets.iconify.design/tabler/list-numbers/) |
| `search.svg` | [`search`](https://icon-sets.iconify.design/tabler/search/) |
| `sum.svg` | [`sum`](https://icon-sets.iconify.design/tabler/sum/) |
| `tip.svg` | [`bulb`](https://icon-sets.iconify.design/tabler/bulb/) |
| `undo.svg` | [`arrow-back-up`](https://icon-sets.iconify.design/tabler/arrow-back-up/) |

## 特殊檔案

- `blank.svg` 保留原本透明占位用途。
- `loading.svg` 使用 SVG `animateTransform`，取代原本 GIF 的旋轉動畫用途。
- Metro Gray theme 的 `accordion_arrows.png`、`layout_arrows.png`、`pagination_icons.png`、`panel_tools.png`、`tabs_icons.png` 與 `tree_icons.png` 在 Mono 中全部拆成獨立 SVG，不直接引用 sprite。

## Sprite 拆分對照

- Accordion：`accordion-expand.svg`、`accordion-collapse.svg`
- Layout：`layout-up.svg`、`layout-down.svg`、`layout-left.svg`、`layout-right.svg`
- Panel／Window：`panel-minimize.svg`、`panel-maximize.svg`、`panel-restore.svg`、`panel-close.svg`、`panel-collapse.svg`、`panel-expand.svg`
- Tabs：`tabs-prev.svg`、`tabs-next.svg`、`tabs-close.svg`
- Tree：`tree-expand.svg`、`tree-collapse.svg`、三個 checkbox SVG、三個資料類型 SVG，以及七個 line SVG
