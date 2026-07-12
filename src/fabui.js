import { createEditorDefinitions } from './editor/editor-definitions.js';
import { createChartFactory } from './chart/chart.js?v=20260712-pie-label-v1';
import { createFabGridFactory } from './grid/fabgrid.js';

var editorDefinitions = createEditorDefinitions();
var FabGrid = createFabGridFactory(editorDefinitions);
var Chart = createChartFactory();
var fabui = {
  version: '2026.7.11',
  editorDefinitions: editorDefinitions,
  Chart: Chart,
  FabGrid: FabGrid,
  FabGridLocales: FabGrid.locales
};

export { fabui };
export default fabui;
