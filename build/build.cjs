const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const buildDate = new Date();
const buildVersion = buildDate.getFullYear() + '.' + (buildDate.getMonth() + 1) + '.' + buildDate.getDate();
const javascriptSources = [
  'core/control.js',
  'button/button.js',
  'calendar/calendar.js',
  'chart/chart.js',
  'grid/fabgrid-types.js',
  'grid/fabgrid-data.js',
  'grid/fabgrid-tree.js',
  'grid/fabgrid-drag.js',
  'grid/fabgrid-editor.js',
  'grid/fabgrid-export.js',
  'grid/fabgrid-view.js',
  'grid/fabgrid-filter-ui.js',
  'grid/fabgrid-selection.js',
  'grid/fabgrid-editor-runtime.js',
  'editbox/editbox-definitions.js',
  'editbox/editor-icons.js',
  'editbox/text-editbox.js',
  'editbox/number-editbox.js',
  'editbox/date-popup.js',
  'editbox/date-editbox.js',
  'editbox/combo-popup.js',
  'editbox/combo-editbox.js',
  'editbox/color-popup.js',
  'editbox/color-editbox.js',
  'editbox/editbox.js',
  'menu/menu.js',
  'menubutton/menubutton.js',
  'splitbutton/splitbutton.js',
  'panel/panel.js',
  'tabs/tabs.js',
  'tree/tree.js',
  'tooltip/tooltip.js',
  'layout/layout.js',
  'window/window.js',
  'messager/messager.js',
  'grid/fabgrid.js',
  'pivot/pivot-utils.js',
  'pivot/pivot-engine.js',
  'pivot/pivot-chart.js',
  'pivot/pivot-grid.js',
  'pivot/pivot-panel.js',
  'pivot/pivot-slicer.js',
  'pivot/pivot-workspace.js'
];
const localeSources = [
  'locales/fabgrid-locale.en.js',
  'locales/fabgrid-locale.zh-TW.js',
  'locales/fabgrid-locale.zh-CN.js'
];

function banner(name) {
  return '/*! FabUI ' + name + ' | Pure JavaScript UI bundle */\n';
}

function stripExports(source) {
  return source
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/g, '')
    .replace(/export\s+(var|let|const)\s+/g, '$1 ')
    .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1')
    .replace(/export\s+default\s+[A-Za-z_$][\w$]*\s*;?/g, '');
}

function minifyJs(source, format) {
  return esbuild.transformSync(source, {
    format: format,
    legalComments: 'none',
    minify: true,
    target: 'es2017'
  }).code.trim();
}

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function isStandaloneComponentStyle(request) {
  return /(?:^|\/)components\.css$/i.test(request);
}

function stripStandaloneThemeSelectors(source) {
  return source;
}

function rewriteCssUrls(source, sourceFile) {
  const sourceDir = path.dirname(sourceFile);
  return source.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, function(match, quote, url) {
    const asset = path.resolve(sourceDir, url);
    const relative = path.relative(srcDir, asset).split(path.sep).join('/');
    if (/^(?:data:|https?:|#)/i.test(url) || !fs.existsSync(asset) || !fs.statSync(asset).isFile()) return match;
    if (relative.indexOf('../') === 0) {
      throw new Error('CSS asset must be located inside src: ' + asset);
    }
    return 'url("' + relative + '")';
  });
}

function bundleCss(entryFile, seen) {
  const absolute = path.resolve(entryFile);
  let source;
  seen = seen || {};
  if (seen[absolute]) return '';
  seen[absolute] = true;
  source = fs.readFileSync(absolute, 'utf8');
  source = source.replace(/@import\s+(?:url\()?(['"])([^'"]+\.css)(?:[?#][^'"]*)?\1\)?\s*;/g, function(match, quote, request) {
    if (isStandaloneComponentStyle(request)) return '';
    return bundleCss(path.resolve(path.dirname(absolute), request), seen);
  });
  return rewriteCssUrls(stripStandaloneThemeSelectors(source), absolute);
}

function copyThemeImages(sourceDir, outputDir) {
  fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(function(entry) {
    const source = path.join(sourceDir, entry.name);
    const output = path.join(outputDir, entry.name);
    if (!entry.isDirectory() || entry.name === '.DS_Store') return;
    if (entry.name === 'images') {
      fs.cpSync(source, output, {
        recursive: true,
        filter: function(file) {
          return path.basename(file) !== '.DS_Store';
        }
      });
      return;
    }
    copyThemeImages(source, output);
  });
}

function copyThemeOutput() {
  const sourceThemeDir = path.join(srcDir, 'theme');
  const outputThemeDir = path.join(distDir, 'theme');
  fs.mkdirSync(outputThemeDir, { recursive: true });
  fs.readdirSync(sourceThemeDir, { withFileTypes: true }).forEach(function(entry) {
    const source = path.join(sourceThemeDir, entry.name);
    const output = path.join(outputThemeDir, entry.name);
    if (entry.name === '.DS_Store') return;
    if (entry.isFile() && /^fabgrid\..+\.css$/i.test(entry.name)) {
      const css = stripStandaloneThemeSelectors(fs.readFileSync(source, 'utf8').replace(/@import\s+(?:url\()?(['"])([^'"]+\.css)(?:[?#][^'"]*)?\1\)?\s*;/g, function(match, quote, request) {
        return isStandaloneComponentStyle(request) ? '' : match;
      }));
      fs.writeFileSync(output, css, 'utf8');
      fs.writeFileSync(output.replace(/\.css$/i, '.min.css'), minifyCss(css), 'utf8');
    }
  });
  copyThemeImages(sourceThemeDir, outputThemeDir);
}

function readSource(file) {
  return fs.readFileSync(path.join(srcDir, file), 'utf8');
}

function createJavascriptBundle() {
  const modules = javascriptSources.map(function(file) {
    return stripExports(readSource(file));
  }).join('\n');
  const locales = localeSources.map(readSource).join('\n');
  return banner('browser global') + '(function(global) {\n' + modules + '\n' +
    'global.fabui = global.fabui || {};\n' +
    'global.fabui.version = ' + JSON.stringify(buildVersion) + ';\n' +
    'global.fabui.editorDefinitions = createEditorDefinitions();\n' +
    'global.fabui.Control = Control;\n' +
    'global.fabui.Button = createButtonFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.Calendar = createCalendarFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.Chart = createChartFactory();\n' +
    'global.fabui.EditBox = createEditBoxFactory(global.fabui.editorDefinitions);\n' +
    'global.fabui.Menu = createMenuFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.MenuButton = createMenuButtonFactory(global.fabui.Control, registerControl, unregisterControl, global.fabui.Button, global.fabui.Menu);\n' +
    'global.fabui.SplitButton = createSplitButtonFactory(global.fabui.Control, registerControl, unregisterControl, global.fabui.MenuButton);\n' +
    'global.fabui.Panel = createPanelFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.Tabs = createTabsFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.Tree = createTreeFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.Tooltip = createTooltipFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.Layout = createLayoutFactory(global.fabui.Control, registerControl, unregisterControl, global.fabui.Panel);\n' +
    'global.fabui.Window = createWindowFactory(global.fabui.Control, registerControl, unregisterControl);\n' +
    'global.fabui.Messager = createMessagerFactory(global.fabui.Window, global.fabui.Button);\n' +
    'global.fabui.FabGrid = createFabGridFactory(global.fabui.editorDefinitions);\n' +
    'global.fabui.pivot = {};\n' +
    'global.fabui.pivot.PivotAggregate = PivotAggregate;\n' +
    'global.fabui.pivot.PivotChart = createPivotChartFactory(global.fabui.Control, registerControl, unregisterControl, PivotEngine, global.fabui.Chart, global.fabui.FabGrid);\n' +
    'global.fabui.pivot.PivotEngine = PivotEngine;\n' +
    'global.fabui.pivot.PivotField = PivotField;\n' +
    'global.fabui.pivot.PivotGrid = createPivotGridFactory(global.fabui.FabGrid, PivotEngine);\n' +
    'global.fabui.pivot.PivotPanel = createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, global.fabui.FabGrid);\n' +
    'global.fabui.pivot.PivotSlicer = createPivotSlicerFactory(Control, registerControl, unregisterControl, PivotEngine, global.fabui.FabGrid);\n' +
    'global.fabui.pivot.PivotWorkspace = createPivotWorkspaceFactory(Control, registerControl, unregisterControl, PivotEngine, global.fabui.pivot.PivotPanel, global.fabui.pivot.PivotGrid, global.fabui.pivot.PivotChart, global.fabui.FabGrid);\n' +
    'global.fabui.pivot.PivotShowAs = PivotShowAs;\n' +
    'global.fabui.pivot.PivotShowTotals = PivotShowTotals;\n' +
    'global.fabui.CellType = CellType;\n' +
    'global.fabui.FabGridLocales = global.fabui.FabGrid.locales;\n' +
    '}(typeof window !== "undefined" ? window : this));\n' + locales;
}

function createEsmLocaleSource(file) {
  const source = readSource(file);
  const browserRoot = "}(typeof window !== 'undefined' ? window : this, function() {";
  const moduleRoot = '}({ fabui: fabui }, function() {';
  if (source.indexOf(browserRoot) < 0) {
    throw new Error('Unable to convert locale for ESM bundle: ' + file);
  }
  return source.replace(browserRoot, moduleRoot);
}

function createEsmJavascriptBundle() {
  const modules = javascriptSources.map(function(file) {
    return stripExports(readSource(file));
  }).join('\n');
  const locales = localeSources.map(createEsmLocaleSource).join('\n');
  return banner('ES module') + modules + '\n' +
    'var editorDefinitions = createEditorDefinitions();\n' +
    'var Button = createButtonFactory(Control, registerControl, unregisterControl);\n' +
    'var Calendar = createCalendarFactory(Control, registerControl, unregisterControl);\n' +
    'var Chart = createChartFactory();\n' +
    'var EditBox = createEditBoxFactory(editorDefinitions);\n' +
    'var Menu = createMenuFactory(Control, registerControl, unregisterControl);\n' +
    'var MenuButton = createMenuButtonFactory(Control, registerControl, unregisterControl, Button, Menu);\n' +
    'var SplitButton = createSplitButtonFactory(Control, registerControl, unregisterControl, MenuButton);\n' +
    'var Panel = createPanelFactory(Control, registerControl, unregisterControl);\n' +
    'var Tabs = createTabsFactory(Control, registerControl, unregisterControl);\n' +
    'var Tree = createTreeFactory(Control, registerControl, unregisterControl);\n' +
    'var Tooltip = createTooltipFactory(Control, registerControl, unregisterControl);\n' +
    'var Layout = createLayoutFactory(Control, registerControl, unregisterControl, Panel);\n' +
    'var Window = createWindowFactory(Control, registerControl, unregisterControl);\n' +
    'var Messager = createMessagerFactory(Window, Button);\n' +
    'var FabGrid = createFabGridFactory(editorDefinitions);\n' +
    'var PivotChart = createPivotChartFactory(Control, registerControl, unregisterControl, PivotEngine, Chart, FabGrid);\n' +
    'var PivotGrid = createPivotGridFactory(FabGrid, PivotEngine);\n' +
    'var PivotPanel = createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid);\n' +
    'var PivotSlicer = createPivotSlicerFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid);\n' +
    'var PivotWorkspace = createPivotWorkspaceFactory(Control, registerControl, unregisterControl, PivotEngine, PivotPanel, PivotGrid, PivotChart, FabGrid);\n' +
    'var pivotNamespace = {\n' +
    '  PivotAggregate: PivotAggregate,\n' +
    '  PivotChart: PivotChart,\n' +
    '  PivotEngine: PivotEngine,\n' +
    '  PivotField: PivotField,\n' +
    '  PivotGrid: PivotGrid,\n' +
    '  PivotPanel: PivotPanel,\n' +
    '  PivotShowAs: PivotShowAs,\n' +
    '  PivotShowTotals: PivotShowTotals,\n' +
    '  PivotSlicer: PivotSlicer,\n' +
    '  PivotWorkspace: PivotWorkspace\n' +
    '};\n' +
    'var fabui = {\n' +
    '  version: ' + JSON.stringify(buildVersion) + ',\n' +
    '  editorDefinitions: editorDefinitions,\n' +
    '  Button: Button,\n' +
    '  Calendar: Calendar,\n' +
    '  Control: Control,\n' +
    '  Chart: Chart,\n' +
    '  EditBox: EditBox,\n' +
    '  Layout: Layout,\n' +
    '  Menu: Menu,\n' +
    '  MenuButton: MenuButton,\n' +
    '  Messager: Messager,\n' +
    '  Panel: Panel,\n' +
    '  SplitButton: SplitButton,\n' +
    '  Tabs: Tabs,\n' +
    '  Tree: Tree,\n' +
    '  Tooltip: Tooltip,\n' +
    '  Window: Window,\n' +
    '  FabGrid: FabGrid,\n' +
    '  pivot: pivotNamespace,\n' +
    '  CellType: CellType,\n' +
    '  FabGridLocales: FabGrid.locales\n' +
    '};\n' + locales + '\n' +
    'export { fabui };\n' +
    'export default fabui;\n';
}

function verifyCssAssets(file) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceDir = path.dirname(file);
  const missing = [];
  source.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, function(match, quote, url) {
    const asset = path.resolve(sourceDir, url);
    if (/^(?:data:|https?:|#)/i.test(url)) return match;
    if (!fs.existsSync(asset) || !fs.statSync(asset).isFile()) missing.push(url);
    return match;
  });
  if (missing.length) {
    throw new Error('Missing built CSS assets in ' + path.basename(file) + ': ' + missing.join(', '));
  }
}

function verifyBuildOutput() {
  const cssFile = path.join(distDir, 'fabui.css');
  const css = fs.readFileSync(cssFile, 'utf8');
  const javascript = fs.readFileSync(path.join(distDir, 'fabui.js'), 'utf8');
  if (css.indexOf('theme/images/clear.png') < 0) {
    throw new Error('Filter clear icon is missing from the FabUI CSS bundle.');
  }
  if (/\.\.\/images\/clear\.png/.test(css)) {
    throw new Error('Filter clear icon uses an invalid parent-directory path.');
  }
  if (/global\.fabui\.(?:TextBox|NumberBox|DateBox|ComboBox)\s*=/.test(javascript)) {
    throw new Error('Legacy Box classes must not be published in the FabUI bundle.');
  }
  if (javascript.indexOf('global.fabui.version = ' + JSON.stringify(buildVersion)) < 0) {
    throw new Error('FabUI build version does not match the build date.');
  }
  if (javascript.indexOf('global.fabui.Chart = createChartFactory()') < 0) {
    throw new Error('FabUI Chart is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.EditBox = createEditBoxFactory(global.fabui.editorDefinitions)') < 0) {
    throw new Error('fabui.EditBox is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Menu = createMenuFactory') < 0) {
    throw new Error('FabUI Menu is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.MenuButton = createMenuButtonFactory') < 0) {
    throw new Error('FabUI MenuButton is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.SplitButton = createSplitButtonFactory') < 0) {
    throw new Error('FabUI SplitButton is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Messager = createMessagerFactory') < 0) {
    throw new Error('FabUI Messager is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.pivot.PivotChart = createPivotChartFactory') < 0) {
    throw new Error('FabUI PivotChart is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.pivot.PivotGrid = createPivotGridFactory') < 0) {
    throw new Error('FabUI PivotGrid is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.pivot.PivotPanel = createPivotPanelFactory') < 0) {
    throw new Error('FabUI PivotPanel is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.pivot.PivotSlicer = createPivotSlicerFactory') < 0) {
    throw new Error('FabUI PivotSlicer is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.pivot.PivotWorkspace = createPivotWorkspaceFactory') < 0) {
    throw new Error('FabUI PivotWorkspace is missing from the JavaScript bundle.');
  }
  if (/global\.fabui\.(?:PivotAggregate|PivotChart|PivotEngine|PivotField|PivotGrid|PivotPanel|PivotShowAs|PivotShowTotals|PivotSlicer|PivotWorkspace)\s*=/.test(javascript)) {
    throw new Error('Pivot APIs must only be published through fabui.pivot.');
  }
  if (javascript.indexOf('global.fabui.Control = Control') < 0) {
    throw new Error('FabUI Control is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Button = createButtonFactory') < 0) {
    throw new Error('FabUI Button is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Calendar = createCalendarFactory') < 0) {
    throw new Error('FabUI Calendar is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('function downloadBlob(') < 0) {
    throw new Error('FabGrid export download helper is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('function installFabGridTree(') < 0) {
    throw new Error('FabGrid TreeGrid module is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('function installFabGridDrag(') < 0) {
    throw new Error('FabGrid row drag module is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('function installFabGridView(') < 0 || javascript.indexOf('function createGridPanel(') < 0) {
    throw new Error('FabGrid view or compatibility type module is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.CellType = CellType') < 0) {
    throw new Error('FabUI CellType is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Window = createWindowFactory') < 0) {
    throw new Error('FabUI Window is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Panel = createPanelFactory') < 0) {
    throw new Error('FabUI Panel is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Tabs = createTabsFactory') < 0) {
    throw new Error('FabUI Tabs is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Tree = createTreeFactory') < 0) {
    throw new Error('FabUI Tree is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Tooltip = createTooltipFactory') < 0) {
    throw new Error('FabUI Tooltip is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.Layout = createLayoutFactory') < 0) {
    throw new Error('FabUI Layout is missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('FabGrid.Row = Row') < 0 || javascript.indexOf('FabGrid.GroupRow = GroupRow') < 0) {
    throw new Error('FabGrid Row types are missing from the JavaScript bundle.');
  }
  if (javascript.indexOf('global.fabui.grid =') >= 0) {
    throw new Error('FabUI grid namespace must not be published.');
  }
  verifyCssAssets(cssFile);
  verifyCssAssets(path.join(distDir, 'fabui.min.css'));
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const javascript = createJavascriptBundle();
const esmJavascript = createEsmJavascriptBundle();
const css = banner('styles') + bundleCss(path.join(srcDir, 'fabui.css'));

fs.writeFileSync(path.join(distDir, 'fabui.js'), javascript, 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.min.js'), banner('browser global min') + minifyJs(javascript, 'iife'), 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.esm.js'), esmJavascript, 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.esm.min.js'), banner('ES module min') + minifyJs(esmJavascript, 'esm'), 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.css'), css, 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.min.css'), minifyCss(css), 'utf8');
copyThemeOutput();
verifyBuildOutput();

console.log('Built FabUI bundles with theme and image dependencies.');
