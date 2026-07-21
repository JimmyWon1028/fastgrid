import { createEditorDefinitions } from './editbox/editbox-definitions.js?v=20260721-mono-variants-v1';
import { createEditBoxFactory } from './editbox/editbox.js?v=20260721-mono-variants-v1';
import { createButtonFactory } from './button/button.js?v=20260721-mono-variants-v1';
import { createAccordionFactory } from './accordion/accordion.js?v=20260721-mono-variants-v1';
import { createCalendarFactory } from './calendar/calendar.js?v=20260721-mono-variants-v1';
import { createCheckBoxFactory } from './checkbox/checkbox.js?v=20260721-mono-variants-v1';
import { createCheckGroupFactory } from './checkgroup/checkgroup.js?v=20260721-mono-variants-v1';
import { createSwitchButtonFactory } from './switchbutton/switchbutton.js?v=20260721-mono-variants-v1';
import { createRadioButtonFactory } from './radiobutton/radiobutton.js?v=20260721-mono-variants-v1';
import { createRadioGroupFactory } from './radiogroup/radiogroup.js?v=20260721-mono-variants-v1';
import { createFileBoxFactory } from './filebox/filebox.js?v=20260721-mono-variants-v1';
import { createFormFactory } from './form/form.js?v=20260721-mono-variants-v1';
import { createChartFactory } from './chart/chart.js?v=20260721-mono-variants-v1';
import { createDiagramFactory } from './diagram/diagram.js?v=20260721-mono-variants-v1';
import {
  Control,
  registerControl,
  unregisterControl
} from './core/control.js?v=20260721-mono-variants-v1';
import { createFabGridFactory } from './grid/fabgrid.js?v=20260721-stylesheet-default-theme-v1';
import { CellType } from './grid/fabgrid-types.js?v=20260721-mono-variants-v1';
import { createLayoutFactory } from './layout/layout.js?v=20260721-mono-variants-v1';
import { createMenuFactory } from './menu/menu.js?v=20260721-mono-variants-v1';
import { createMenuButtonFactory } from './menubutton/menubutton.js?v=20260721-mono-variants-v1';
import { createMessagerFactory } from './messager/messager.js?v=20260721-mono-variants-v1';
import { createPanelFactory } from './panel/panel.js?v=20260721-mono-variants-v1';
import { createPropertyGridFactory } from './propertygrid/propertygrid.js?v=20260721-mono-variants-v1';
import { createSplitButtonFactory } from './splitbutton/splitbutton.js?v=20260721-mono-variants-v1';
import { createTabsFactory } from './tabs/tabs.js?v=20260721-mono-variants-v1';
import { createTreeFactory } from './tree/tree.js?v=20260721-mono-variants-v1';
import { createTooltipFactory } from './tooltip/tooltip.js?v=20260721-mono-variants-v1';
import { createWindowFactory } from './window/window.js?v=20260721-mono-variants-v1';
import {
  PivotAggregate,
  PivotEngine,
  PivotField,
  PivotShowAs,
  PivotShowTotals
} from './pivot/pivot-engine.js?v=20260721-mono-variants-v1';
import { createPivotChartFactory } from './pivot/pivot-chart.js?v=20260721-mono-variants-v1';
import { createPivotGridFactory } from './pivot/pivot-grid.js?v=20260721-mono-variants-v1';
import { createPivotPanelFactory } from './pivot/pivot-panel.js?v=20260721-mono-variants-v1';
import { createPivotSlicerFactory } from './pivot/pivot-slicer.js?v=20260721-mono-variants-v1';
import { createPivotWorkspaceFactory } from './pivot/pivot-workspace.js?v=20260721-mono-variants-v1';

var editorDefinitions = createEditorDefinitions();
var EditBox = createEditBoxFactory(editorDefinitions);
var Button = createButtonFactory(Control, registerControl, unregisterControl);
var Calendar = createCalendarFactory(Control, registerControl, unregisterControl);
var CheckBox = createCheckBoxFactory(Control, registerControl, unregisterControl);
var CheckGroup = createCheckGroupFactory(
  Control,
  registerControl,
  unregisterControl,
  CheckBox
);
var SwitchButton = createSwitchButtonFactory(
  Control,
  registerControl,
  unregisterControl
);
var RadioButton = createRadioButtonFactory(Control, registerControl, unregisterControl);
var RadioGroup = createRadioGroupFactory(
  Control,
  registerControl,
  unregisterControl,
  RadioButton
);
var FileBox = createFileBoxFactory(
  Control,
  registerControl,
  unregisterControl,
  EditBox
);
var Form = createFormFactory(
  Control,
  registerControl,
  unregisterControl,
  EditBox
);
var FabGrid = createFabGridFactory(editorDefinitions);
var Chart = createChartFactory();
var Window = createWindowFactory(Control, registerControl, unregisterControl);
var Menu = createMenuFactory(Control, registerControl, unregisterControl);
var Tabs = createTabsFactory(Control, registerControl, unregisterControl);
var Diagram = createDiagramFactory(
  Control,
  registerControl,
  unregisterControl,
  Button,
  EditBox,
  Menu,
  Tabs
);
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
var Accordion = createAccordionFactory(
  Control,
  registerControl,
  unregisterControl,
  Panel
);
var PropertyGrid = createPropertyGridFactory(
  Control,
  registerControl,
  unregisterControl,
  EditBox
);
var Tree = createTreeFactory(Control, registerControl, unregisterControl);
var Tooltip = createTooltipFactory(Control, registerControl, unregisterControl);
var Layout = createLayoutFactory(Control, registerControl, unregisterControl, Panel);
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
  Accordion: Accordion,
  Button: Button,
  Calendar: Calendar,
  CheckBox: CheckBox,
  CheckGroup: CheckGroup,
  SwitchButton: SwitchButton,
  RadioButton: RadioButton,
  RadioGroup: RadioGroup,
  Control: Control,
  Chart: Chart,
  Diagram: Diagram,
  EditBox: EditBox,
  FileBox: FileBox,
  Form: Form,
  FabGrid: FabGrid,
  Layout: Layout,
  Menu: Menu,
  MenuButton: MenuButton,
  Messager: Messager,
  Panel: Panel,
  PropertyGrid: PropertyGrid,
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
