const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const packageDir = path.join(root, 'packages', 'fabgrid-jquery');
const sourceFile = path.join(packageDir, 'src', 'fabgrid-jquery.js');
const distDir = process.env.FABUI_PACKAGE_DIST_DIR ?
  path.resolve(process.env.FABUI_PACKAGE_DIST_DIR) :
  path.join(packageDir, 'dist');
const wrapperDistDir = process.env.FABUI_DIST_DIR ?
  path.join(path.resolve(process.env.FABUI_DIST_DIR), 'wrapper') :
  path.join(root, 'dist', 'wrapper');
const source = fs.readFileSync(sourceFile, 'utf8');
const browserSource = source
  .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1')
  .replace(/export default createFabGridJQuery;?/, '');
const browserEntry = '(function(global) {\n' + browserSource + '\n' +
  'var plugin = createFabGridJQuery(global.jQuery, global.fabui);\n' +
  'global.fabuiJQuery = plugin;\n' +
  '})(typeof globalThis !== "undefined" ? globalThis : window);\n';
const esmEntry = source;
const minifiedBrowserEntry = esbuild.transformSync(browserEntry, {
  minify: true,
  target: 'es2017'
}).code.trim();

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(wrapperDistDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'fabgrid-jquery.js'), browserEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-jquery.min.js'), minifiedBrowserEntry);
fs.writeFileSync(path.join(wrapperDistDir, 'fabgrid-jquery.min.js'), minifiedBrowserEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-jquery.esm.js'), esmEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-jquery.esm.min.js'), esbuild.transformSync(esmEntry, {
  format: 'esm',
  minify: true,
  target: 'es2017'
}).code.trim());

['fabgrid-jquery.js', 'fabgrid-jquery.min.js', 'fabgrid-jquery.esm.js', 'fabgrid-jquery.esm.min.js'].forEach(function(name) {
  if (!fs.existsSync(path.join(distDir, name)) || !fs.statSync(path.join(distDir, name)).size) {
    throw new Error('Missing jQuery wrapper output: ' + name);
  }
});
if (!fs.existsSync(path.join(wrapperDistDir, 'fabgrid-jquery.min.js'))) throw new Error('Missing shared jQuery wrapper output.');

console.log('Built FabGrid jQuery wrapper bundles.');
