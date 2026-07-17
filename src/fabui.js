import { createEditorDefinitions } from './editor/editor-definitions.js?v=20260713-color-names-v10';
import { createChartFactory } from './chart/chart.js?v=20260717-chart-axis-density-v4';
import {
  Control,
  registerControl,
  unregisterControl
} from './core/control.js?v=20260716-control-events-v3';
import { createFabGridFactory } from './grid/fabgrid.js?v=20260717-tree-context-menu-v2';
import { CellType } from './grid/fabgrid-types.js?v=20260716-row-types-v1';
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
var FabGrid = createFabGridFactory(editorDefinitions);
var Chart = createChartFactory();
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
  version: '2026.7.11',
  editorDefinitions: editorDefinitions,
  Control: Control,
  Chart: Chart,
  FabGrid: FabGrid,
  pivot: pivotNamespace,
  CellType: CellType,
  FabGridLocales: FabGrid.locales
};

export { fabui };
export default fabui;
