const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const sourceFile = path.join(root, 'src', 'diagram', 'diagram.js');
const styleFile = path.join(root, 'src', 'diagram', 'diagram.css');

function banner(name) {
  return '/*! FabUI Diagram ' + name + ' | Requires FabUI core */\n';
}

function stripExports(source) {
  return source
    .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1')
    .replace(/export\s+(var|let|const)\s+/g, '$1 ');
}

function minifyJs(source) {
  return esbuild.transformSync(source, {
    format: 'iife',
    legalComments: 'none',
    minify: true,
    target: 'es2017'
  }).code.trim();
}

function minifyCss(source) {
  return esbuild.transformSync(source, {
    loader: 'css',
    legalComments: 'none',
    minify: true,
    target: 'es2017'
  }).code.trim();
}

function createBrowserBundle(source) {
  return banner('browser global') +
    '(function(global) {\n' +
    "'use strict';\n" +
    'if (!global.fabui || typeof global.fabui.Control !== "function" ||\n' +
    '    typeof global.fabui.Control._registerControl !== "function" ||\n' +
    '    typeof global.fabui.Button !== "function" ||\n' +
    '    typeof global.fabui.EditBox !== "function" ||\n' +
    '    typeof global.fabui.Menu !== "function" ||\n' +
    '    typeof global.fabui.Tabs !== "function") {\n' +
    '  throw new Error("Load fabui.js before diagram.js.");\n' +
    '}\n' +
    source + '\n' +
    'global.fabui.Diagram = createDiagramFactory(\n' +
    '  global.fabui.Control,\n' +
    '  global.fabui.Control._registerControl,\n' +
    '  global.fabui.Control._unregisterControl,\n' +
    '  global.fabui.Button,\n' +
    '  global.fabui.EditBox,\n' +
    '  global.fabui.Menu,\n' +
    '  global.fabui.Tabs\n' +
    ');\n' +
    '}(typeof window !== "undefined" ? window : this));\n';
}

function verifyOutput() {
  const core = fs.readFileSync(path.join(distDir, 'fabui.js'), 'utf8');
  const browser = fs.readFileSync(path.join(distDir, 'diagram.js'), 'utf8');
  if (/createDiagramFactory|global\.fabui\.Diagram/.test(core)) {
    throw new Error('FabUI core bundle must not contain Diagram.');
  }
  if (browser.indexOf('Load fabui.js before diagram.js.') < 0 ||
      browser.indexOf('global.fabui.Diagram = createDiagramFactory') < 0) {
    throw new Error('Diagram browser bundle dependency contract is incomplete.');
  }
  [
    'diagram.js',
    'diagram.min.js',
    'diagram.css',
    'diagram.min.css'
  ].forEach(function(file) {
    const output = path.join(distDir, file);
    if (!fs.existsSync(output) || !fs.statSync(output).size) {
      throw new Error('Missing Diagram output: ' + file);
    }
  });
}

if (!fs.existsSync(path.join(distDir, 'fabui.js'))) {
  throw new Error('Build FabUI core before building diagram.*.');
}

const source = stripExports(fs.readFileSync(sourceFile, 'utf8'));
const styles = banner('styles') + fs.readFileSync(styleFile, 'utf8');
const browser = createBrowserBundle(source);

fs.mkdirSync(distDir, { recursive: true });
[
  'diagram.esm.js',
  'diagram.esm.min.js'
].forEach(function(file) {
  fs.rmSync(path.join(distDir, file), { force: true });
});
fs.writeFileSync(path.join(distDir, 'diagram.js'), browser, 'utf8');
fs.writeFileSync(
  path.join(distDir, 'diagram.min.js'),
  banner('browser global min') + minifyJs(browser),
  'utf8'
);
fs.writeFileSync(path.join(distDir, 'diagram.css'), styles, 'utf8');
fs.writeFileSync(
  path.join(distDir, 'diagram.min.css'),
  minifyCss(styles),
  'utf8'
);
verifyOutput();

console.log('Built standalone FabUI Diagram bundles.');
