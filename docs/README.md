# FabUI API 文件

本目錄記錄目前公開的 FabUI、FabGrid、Pivot 與獨立附加元件 API。完整 options、methods 與 events 以各元件手冊為準。

## 共用基礎

| 文件 | 內容 |
| --- | --- |
| [Control](./control-api.md) | Control registry 與受管理的 DOM listener。 |
| [Theme](./theme-api.md) | 19 組主題、CSS 載入順序與相容 API。 |

## 資料與分析

| 文件 | 內容 |
| --- | --- |
| [FabGrid](./fabgrid-api.md) | Grid、TreeGrid、遠端資料、編輯、篩選與匯出。 |
| [Chart](./chart-api.md) | SVG Column、Bar、Line 與 Pie。 |
| [Pivot](./pivotgrid-api.md) | PivotEngine、PivotPanel、PivotSlicer 與 PivotGrid。 |
| [PivotChart](./pivotchart-api.md) | Pivot view 圖表。 |
| [PivotWorkspace](./pivotworkspace-api.md) | PivotPanel、PivotGrid 與 PivotChart 工作區。 |

## 表單與輸入

| API | API |
| --- | --- |
| [EditBox](./editbox-api.md) | [FileBox](./filebox-api.md) |
| [HtmlEditor](./htmleditor-api.md) |  |
| [Form](./form-api.md) | [Calendar](./calendar-api.md) |
| [CheckBox](./checkbox-api.md) | [CheckGroup](./checkgroup-api.md) |
| [RadioButton](./radiobutton-api.md) | [RadioGroup](./radiogroup-api.md) |
| [SwitchButton](./switchbutton-api.md) |  |

## 導覽、容器與命令

| API | API |
| --- | --- |
| [Button](./button-api.md) | [Tabs](./tabs-api.md) |
| [Tree](./tree-api.md) | [PropertyGrid](./propertygrid-api.md) |
| [Panel](./panel-api.md) | [Accordion](./accordion-api.md) |
| [Window](./window-api.md) | [Layout](./layout-api.md) |
| [Menu](./menu-api.md) | [MenuButton](./menubutton-api.md) |
| [SplitButton](./splitbutton-api.md) | [Messager](./messager-api.md) |
| [Tooltip](./tooltip-api.md) |  |

## 獨立附加元件

下列元件必須先載入 FabUI core，再載入各自的 CSS 與 JavaScript。

| 文件 | 公開入口 |
| --- | --- |
| [Diagram](./diagram-api.md) | `fabui.Diagram` |
| [Gantt](./gantt-api.md) | `fabui.Gantt` |
| [Scheduler](./scheduler-api.md) | `fabui.Scheduler` |
| [HtmlEditor](./htmleditor-api.md) | `fabui.HtmlEditor` |

## Wrapper（暫緩）

Vue 2 與 jQuery wrapper 保留原始碼與手冊，但不納入預設 build 或 `build:all`。

- [Vue 2 Wrapper](./vue-api.md)
- [jQuery Wrapper](./jquery-api.md)
