const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');
const buildDate = new Date();
const buildVersion = buildDate.getFullYear() + '.' + (buildDate.getMonth() + 1) + '.' + buildDate.getDate();
const javascriptSources = [
  'chart/chart.js',
  'grid/fabgrid-data.js',
  'grid/fabgrid-tree.js',
  'grid/fabgrid-drag.js',
  'grid/fabgrid-editor.js',
  'grid/fabgrid-export.js',
  'editor/editor-definitions.js',
  'grid/fabgrid.js'
];
const localeSources = [
  'locales/fabgrid-locale.en.js',
  'locales/fabgrid-locale.zh-TW.js',
  'locales/fabgrid-locale.zh-CN.js'
];

function banner(name) {
  return '/*! FabUI ' + name + ' | FabGrid-only pure JavaScript bundle */\n';
}

function stripExports(source) {
  return source
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/g, '')
    .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1');
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
  return /(?:^|\/)(?:components|tabs)\.css$/i.test(request);
}

function stripStandaloneThemeSelectors(source) {
  return source.replace(/(\.fg-root\.fg-theme-[^{,]+),\s*\.fui-tabs\.fg-theme-[^{]+(\{)/g, '$1 $2');
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
    'global.fabui.Chart = createChartFactory();\n' +
    'global.fabui.FabGrid = createFabGridFactory(global.fabui.editorDefinitions);\n' +
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
    'var Chart = createChartFactory();\n' +
    'var FabGrid = createFabGridFactory(editorDefinitions);\n' +
    'var fabui = {\n' +
    '  version: ' + JSON.stringify(buildVersion) + ',\n' +
    '  editorDefinitions: editorDefinitions,\n' +
    '  Chart: Chart,\n' +
    '  FabGrid: FabGrid,\n' +
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
  if (/global\.fabui\.(?:TextBox|NumberBox|DateBox|ComboBox|Tabs)\s*=/.test(javascript)) {
    throw new Error('Standalone components must not be published in the FabGrid bundle.');
  }
  if (javascript.indexOf('global.fabui.version = ' + JSON.stringify(buildVersion)) < 0) {
    throw new Error('FabUI build version does not match the build date.');
  }
  if (javascript.indexOf('global.fabui.Chart = createChartFactory()') < 0) {
    throw new Error('FabUI Chart is missing from the JavaScript bundle.');
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
