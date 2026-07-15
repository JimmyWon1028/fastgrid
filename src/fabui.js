import { createEditorDefinitions } from './editor/editor-definitions.js?v=20260713-color-names-v10';
import { createChartFactory } from './chart/chart.js?v=20260712-pie-label-v1';
import { createFabGridFactory } from './grid/fabgrid.js?v=20260715-row-header-width-v1';

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
