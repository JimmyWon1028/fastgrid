import { createEditorDefinitions } from './editbox/editbox-definitions.js?v=20260717-editor-names-v1';
import { createEditBoxFactory } from './editbox/editbox.js?v=20260718-final-audit-v1';
import { createButtonFactory } from './button/button.js?v=20260718-button-icon-left-v1';
import { createCalendarFactory } from './calendar/calendar.js?v=20260718-calendar-v1';
import { createChartFactory } from './chart/chart.js?v=20260717-chart-axis-density-v4';
import {
  Control,
  registerControl,
  unregisterControl
} from './core/control.js?v=20260716-control-events-v3';
import { createFabGridFactory } from './grid/fabgrid.js?v=20260718-row-drop-width-v1';
import { CellType } from './grid/fabgrid-types.js?v=20260716-row-types-v1';
import { createLayoutFactory } from './layout/layout.js?v=20260718-final-audit-v1';
import { createMenuFactory } from './menu/menu.js?v=20260718-menu-trigger-v3';
import { createMenuButtonFactory } from './menubutton/menubutton.js?v=20260718-menubutton-hover-transfer-v1';
import { createMessagerFactory } from './messager/messager.js?v=20260718-messager-v3';
import { createPanelFactory } from './panel/panel.js?v=20260718-panel-motion-v1';
import { createSplitButtonFactory } from './splitbutton/splitbutton.js?v=20260718-splitbutton-v3';
import { createTabsFactory } from './tabs/tabs.js?v=20260718-tabs-directional-drop-v1';
import { createTreeFactory } from './tree/tree.js?v=20260718-tree-v1';
import { createTooltipFactory } from './tooltip/tooltip.js?v=20260718-final-audit-v1';
import { createWindowFactory } from './window/window.js?v=20260718-final-audit-v1';
import {
  PivotAggregate,
  PivotEngine,
  PivotField,
  PivotShowAs,
  PivotShowTotals
} from './pivot/pivot-engine.js?v=20260717-pivot-advanced-v1';
import { createPivotChartFactory } from './pivot/pivot-chart.js?v=20260717-pivot-refactor-v1';
import { createPivotGridFactory } from './pivot/pivot-grid.js?v=20260717-pivot-refactor-v1';
import { createPivotPanelFactory } from './pivot/pivot-panel.js?v=20260717-pivot-advanced-v1';
import { createPivotSlicerFactory } from './pivot/pivot-slicer.js?v=20260717-pivot-advanced-v1';
import { createPivotWorkspaceFactory } from './pivot/pivot-workspace.js?v=20260717-pivot-advanced-v1';

var editorDefinitions = createEditorDefinitions();
var EditBox = createEditBoxFactory(editorDefinitions);
var Button = createButtonFactory(Control, registerControl, unregisterControl);
var Calendar = createCalendarFactory(Control, registerControl, unregisterControl);
var FabGrid = createFabGridFactory(editorDefinitions);
var Chart = createChartFactory();
var Menu = createMenuFactory(Control, registerControl, unregisterControl);
var MenuButton = createMenuButtonFactory(
  Control,
  registerControl,
  unregisterControl,
  Button,
  Menu
);
var SplitButton = createSplitButtonFactory(
  Control,
  registerControl,
  unregisterControl,
  MenuButton
);
var Panel = createPanelFactory(Control, registerControl, unregisterControl);
var Tabs = createTabsFactory(Control, registerControl, unregisterControl);
var Tree = createTreeFactory(Control, registerControl, unregisterControl);
var Tooltip = createTooltipFactory(Control, registerControl, unregisterControl);
var Layout = createLayoutFactory(Control, registerControl, unregisterControl, Panel);
var Window = createWindowFactory(Control, registerControl, unregisterControl);
var Messager = createMessagerFactory(Window, Button);
var PivotChart = createPivotChartFactory(Control, registerControl, unregisterControl, PivotEngine, Chart, FabGrid);
var PivotGrid = createPivotGridFactory(FabGrid, PivotEngine);
var PivotPanel = createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid);
var PivotSlicer = createPivotSlicerFactory(
  Control,
  registerControl,
  unregisterControl,
  PivotEngine,
  FabGrid
);
var PivotWorkspace = createPivotWorkspaceFactory(
  Control,
  registerControl,
  unregisterControl,
  PivotEngine,
  PivotPanel,
  PivotGrid,
  PivotChart,
  FabGrid
);
var pivotNamespace = {
  PivotAggregate: PivotAggregate,
  PivotChart: PivotChart,
  PivotEngine: PivotEngine,
  PivotField: PivotField,
  PivotGrid: PivotGrid,
  PivotPanel: PivotPanel,
  PivotShowAs: PivotShowAs,
  PivotShowTotals: PivotShowTotals,
  PivotSlicer: PivotSlicer,
  PivotWorkspace: PivotWorkspace
};
var fabui = {
  version: '2026.7.18',
  editorDefinitions: editorDefinitions,
  Button: Button,
  Calendar: Calendar,
  Control: Control,
  Chart: Chart,
  EditBox: EditBox,
  FabGrid: FabGrid,
  Layout: Layout,
  Menu: Menu,
  MenuButton: MenuButton,
  Messager: Messager,
  Panel: Panel,
  SplitButton: SplitButton,
  Tabs: Tabs,
  Tree: Tree,
  Tooltip: Tooltip,
  Window: Window,
  pivot: pivotNamespace,
  CellType: CellType,
  FabGridLocales: FabGrid.locales
};

export { fabui };
export default fabui;
