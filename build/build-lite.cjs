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
  'editbox/date-popup.js',
  'editbox/combo-popup.js',
  'editbox/color-popup.js',
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
const componentStyleSources = [
  'chart/chart.css',
  'grid/fabgrid.css',
  'pivot/pivot-chart.css',
  'pivot/pivot-grid.css',
  'pivot/pivot-panel.css',
  'pivot/pivot-slicer.css',
  'pivot/pivot-workspace.css',
  'editbox/date-editbox.css',
  'editbox/date-editbox-theme.css',
  'editbox/combo-editbox.css',
  'editbox/color-editbox.css'
];
const liteIconSelectors = [
  '.pagination-first',
  '.pagination-prev',
  '.pagination-next',
  '.pagination-last',
  '.pagination-load',
  '.pagination-loading',
  '.icon-datebox',
  '.icon-refwin',
  '.icon-export',
  '.icon-excel',
  '.icon-clear',
  '.fg-filter-menu-clear .fg-filter-menu-funnel',
  '.icon-fullscreen',
  '.icon-search',
  '.icon-row-number'
];
const themeSources = fs.readdirSync(path.join(srcDir, 'theme'))
  .filter(function(file) {
    return /^fabgrid\..+\.css$/i.test(file);
  })
  .sort()
  .map(function(file) {
    return 'theme/' + file;
  });

function banner(name) {
  return '/*! FabUI Lite ' + name + ' | FabGrid, TreeGrid, Pivot and Chart */\n';
}

function readSource(file) {
  return fs.readFileSync(path.join(srcDir, file), 'utf8');
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

function shouldSkipCssImport(request) {
  return /(?:^|\/)(?:components|tabs)\.css$/i.test(request);
}

function rewriteCssUrls(source, sourceFile) {
  const sourceDir = path.dirname(sourceFile);
  return source.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, function(match, quote, url) {
    const asset = path.resolve(sourceDir, url);
    let relative = path.relative(srcDir, asset).split(path.sep).join('/');
    if (/^(?:data:|https?:|#)/i.test(url) || !fs.existsSync(asset) || !fs.statSync(asset).isFile()) {
      return match;
    }
    if (relative.indexOf('../') === 0) {
      throw new Error('CSS asset must be located inside src: ' + asset);
    }
    if (relative.indexOf('theme/mono/images/') === 0) {
      relative = relative.replace('theme/mono/images/', 'theme/mono/');
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
    if (shouldSkipCssImport(request)) return '';
    return bundleCss(path.resolve(path.dirname(absolute), request), seen);
  });
  if (/[/\\]theme[/\\]fabgrid\.[^/\\]+\.css$/i.test(absolute)) {
    source = source.replace(/,\s*\.fui-tabs\.fg-theme-[A-Za-z0-9-]+/g, '');
  }
  return rewriteCssUrls(source, absolute);
}

function createCssBundle() {
  const seen = {};
  const sources = componentStyleSources.concat(themeSources);
  const icons = readSource('fabui.icon.css').replace(/([^{}]+)\{([^{}]*)\}/g, function(match, selector) {
    return liteIconSelectors.some(function(allowed) {
      return selector.indexOf(allowed) >= 0;
    }) ? match : '';
  });
  return banner('styles') + sources.map(function(file) {
    return bundleCss(path.join(srcDir, file), seen);
  }).join('\n') + '\n' + rewriteCssUrls(icons, path.join(srcDir, 'fabui.icon.css'));
}

function copyCssAssets(css) {
  const copied = {};
  css.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, function(match, quote, url) {
    let source = path.join(srcDir, url);
    const output = path.join(distDir, url);
    if (/^(?:data:|https?:|#)/i.test(url) || copied[url]) return match;
    if (url.indexOf('theme/mono/') === 0 && !fs.existsSync(source)) {
      source = path.join(srcDir, 'theme', 'mono', 'images', url.slice('theme/mono/'.length));
    }
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      throw new Error('Missing Lite CSS asset: ' + url);
    }
    copied[url] = true;
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(source, output);
    return match;
  });
}

function createBrowserJavascriptBundle() {
  const modules = javascriptSources.map(function(file) {
    return stripExports(readSource(file));
  }).join('\n');
  const locales = localeSources.map(readSource).join('\n');
  return banner('browser global') + '(function(global) {\n' + modules + '\n' +
    'global.fabui = global.fabui || {};\n' +
    'global.fabui.version = ' + JSON.stringify(buildVersion) + ';\n' +
    'global.fabui.editorDefinitions = createEditorDefinitions();\n' +
    'global.fabui.Control = Control;\n' +
    'global.fabui.Chart = createChartFactory();\n' +
    'global.fabui.FabGrid = createFabGridFactory(global.fabui.editorDefinitions);\n' +
    'global.fabui.pivot = {};\n' +
    'global.fabui.pivot.PivotAggregate = PivotAggregate;\n' +
    'global.fabui.pivot.PivotChart = createPivotChartFactory(Control, registerControl, unregisterControl, PivotEngine, global.fabui.Chart, global.fabui.FabGrid);\n' +
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

function verifyCssAssets(file) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceDir = path.dirname(file);
  const missing = [];
  source.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, function(match, quote, url) {
    const assetUrl = url.replace(/[?#].*$/, '');
    const asset = path.resolve(sourceDir, assetUrl);
    if (/^(?:data:|https?:|#)/i.test(url)) return match;
    if (!fs.existsSync(asset) || !fs.statSync(asset).isFile()) missing.push(url);
    return match;
  });
  if (missing.length) {
    throw new Error('Missing built Lite CSS assets in ' + path.basename(file) + ': ' + missing.join(', '));
  }
}

function verifyBuildOutput() {
  const javascript = fs.readFileSync(path.join(distDir, 'fabui.lite.js'), 'utf8');
  const cssFile = path.join(distDir, 'fabui.lite.css');
  const forbiddenFactories = [
    'createButtonFactory',
    'createCalendarFactory',
    'createCheckBoxFactory',
    'createDiagramFactory',
    'createEditBoxFactory',
    'createFileBoxFactory',
    'createFormFactory',
    'createLayoutFactory',
    'createMenuFactory',
    'createPanelFactory',
    'createTabsFactory',
    'createTreeFactory',
    'createTooltipFactory',
    'createWindowFactory'
  ];
  if (javascript.indexOf('global.fabui.FabGrid = createFabGridFactory') < 0 ||
      javascript.indexOf('global.fabui.Chart = createChartFactory()') < 0 ||
      javascript.indexOf('global.fabui.pivot.PivotWorkspace = createPivotWorkspaceFactory') < 0) {
    throw new Error('FabUI Lite is missing FabGrid, Pivot or Chart.');
  }
  if (javascript.indexOf('function installFabGridTree(') < 0 ||
      javascript.indexOf('FabGrid.prototype.isTreeGrid = function()') < 0 ||
      javascript.indexOf('FabGrid.prototype.expandAllTreeNodes = function()') < 0) {
    throw new Error('FabUI Lite is missing the FabGrid TreeGrid module.');
  }
  forbiddenFactories.forEach(function(factory) {
    if (javascript.indexOf(factory) >= 0) {
      throw new Error('FabUI Lite contains an excluded component factory: ' + factory);
    }
  });
  verifyCssAssets(cssFile);
  verifyCssAssets(path.join(distDir, 'fabui.lite.min.css'));
}

fs.mkdirSync(distDir, { recursive: true });
fs.rmSync(path.join(distDir, 'theme', 'mono', 'images'), { recursive: true, force: true });
[
  'fabui.lite.js',
  'fabui.lite.min.js',
  'fabui.lite.esm.js',
  'fabui.lite.esm.min.js',
  'fabui.lite.css',
  'fabui.lite.min.css'
].forEach(function(file) {
  fs.rmSync(path.join(distDir, file), { force: true });
});

const javascript = createBrowserJavascriptBundle();
const css = createCssBundle();

fs.writeFileSync(path.join(distDir, 'fabui.lite.js'), javascript, 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.lite.min.js'), banner('browser global min') + minifyJs(javascript, 'iife'), 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.lite.css'), css, 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.lite.min.css'), minifyCss(css), 'utf8');
copyCssAssets(css);
verifyBuildOutput();

console.log('Built FabUI Lite bundles with FabGrid, TreeGrid, Pivot, Chart and required dependencies.');
