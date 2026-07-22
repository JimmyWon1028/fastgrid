# FabUI Theme API

FabUI 公開元件提供相同的 19 組 theme metadata。Default 配色已包含在 FabUI core 與 Lite CSS；其他主題由外部 Theme CSS 覆蓋。

## 載入方式

外部 Theme CSS 必須在 FabUI core、Diagram、Gantt、Scheduler 等所有元件 CSS 之後載入：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.diagram.css">
<link rel="stylesheet" href="./dist/theme/fabui.metro-blue.css">
```

切換主題時，請更換外部 Theme CSS 並重新載入頁面。不要使用 runtime class 動態切換配色。

## 主題清單

| 系列 | Theme |
| --- | --- |
| Default | `default` |
| 基礎 | `black`、`bootstrap`、`cupertino`、`dark-hive`、`pepper-grinder`、`sunny` |
| Material | `material`、`material-blue`、`material-teal` |
| Metro | `metro`、`metro-blue`、`metro-gray`、`metro-green`、`metro-orange`、`metro-red` |
| Mono | `mono`、`mono-red`、`mono-green` |

Mono 系列共用 `dist/theme/mono/` 的單色 SVG，不使用 PNG／GIF sprite。

## 相容 API

元件的 `theme` option、`setTheme(theme)`、`themes` 與 `normalizeTheme()` 保留 API 相容與 metadata 用途。它們不會載入或更換外部 Theme CSS；實際配色由頁面最後載入的 Theme CSS 決定。

附加到 `document.body` 的 popup 使用固定 component selector，因此會跟隨同一份外部 Theme CSS。
