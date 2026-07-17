const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const sourceEntry = path.join(root, 'src', 'editbox', 'editbox.js');
const styleEntry = path.join(root, 'src', 'editbox', 'editbox.css');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');

function banner(name) {
  return '/*! FabUI ' + name + ' | Pure JavaScript EditBox bundle */\n';
}

function readCss(file, seen) {
  const absolute = path.resolve(file);
  let source;
  seen = seen || {};
  if (seen[absolute]) return '';
  seen[absolute] = true;
  source = fs.readFileSync(absolute, 'utf8');
  return source.replace(/@import\s+["']([^"']+\.css)["'];?/g, function(match, request) {
    return readCss(path.resolve(path.dirname(absolute), request), seen);
  });
}

function transform(source, options) {
  return esbuild.transformSync(source, options).code.trim();
}

function bundleJavaScript(format) {
  return esbuild.buildSync({
    entryPoints: [sourceEntry],
    bundle: true,
    format: format,
    target: 'es2017',
    write: false
  }).outputFiles[0].text.trim();
}

fs.mkdirSync(distDir, { recursive: true });

const browserEntry = [
  "import EditBox, { editorDefinitions } from './src/editbox/editbox.js';",
  'var root = typeof globalThis !== "undefined" ? globalThis : window;',
  'root.fabui = root.fabui || {};',
  'root.fabui.EditBox = EditBox;',
  'root.fabui.EditBox.editorDefinitions = editorDefinitions;'
].join('\n');
const browserSource = esbuild.buildSync({
  stdin: {
    contents: browserEntry,
    resolveDir: root,
    sourcefile: 'editbox.browser.js'
  },
  bundle: true,
  format: 'iife',
  target: 'es2017',
  write: false
}).outputFiles[0].text.trim();
const esmSource = bundleJavaScript('esm');
const cssSource = banner('styles') + readCss(styleEntry);

fs.writeFileSync(path.join(distDir, 'editbox.js'), banner('browser global') + browserSource + '\n');
fs.writeFileSync(
  path.join(distDir, 'editbox.min.js'),
  banner('browser global min') + transform(browserSource, { minify: true, target: 'es2017' }) + '\n'
);
fs.writeFileSync(path.join(distDir, 'editbox.esm.js'), banner('ES module') + esmSource + '\n');
fs.writeFileSync(
  path.join(distDir, 'editbox.esm.min.js'),
  banner('ES module min') + transform(esmSource, { format: 'esm', minify: true, target: 'es2017' }) + '\n'
);
fs.writeFileSync(path.join(distDir, 'editbox.css'), cssSource);
fs.writeFileSync(
  path.join(distDir, 'editbox.min.css'),
  transform(cssSource, { loader: 'css', minify: true }) + '\n'
);

[
  'editbox.js',
  'editbox.min.js',
  'editbox.esm.js',
  'editbox.esm.min.js',
  'editbox.css',
  'editbox.min.css'
].forEach(function(name) {
  const file = path.join(distDir, name);
  if (!fs.existsSync(file) || !fs.statSync(file).size) {
    throw new Error('Missing EditBox output: ' + name);
  }
});

console.log('Built FabUI EditBox bundles.');
