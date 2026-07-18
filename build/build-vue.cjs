const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const packageDir = path.join(root, 'packages', 'fabgrid-vue');
const sourceFile = path.join(packageDir, 'src', 'fabgrid-vue.js');
const vueRuntimeFile = path.join(root, 'node_modules', 'vue', 'dist', 'vue.min.js');
const distDir = process.env.FABUI_PACKAGE_DIST_DIR ?
  path.resolve(process.env.FABUI_PACKAGE_DIST_DIR) :
  path.join(packageDir, 'dist');
const wrapperDistDir = process.env.FABUI_DIST_DIR ?
  path.join(path.resolve(process.env.FABUI_DIST_DIR), 'wrapper') :
  path.join(root, 'dist', 'wrapper');
const source = fs.readFileSync(sourceFile, 'utf8');
const browserSource = source
  .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1');
const browserEntry = '(function(global) {\n' + browserSource + '\n' +
  'var plugin = createFabGridVue(global.Vue, global.fabui);\n' +
  'global.fabuiVue = plugin;\n' +
  'global.Vue.use(plugin);\n' +
  '})(typeof globalThis !== "undefined" ? globalThis : window);\n';
const esmEntry = source + '\nexport default createFabGridVue;\n';
const minifiedBrowserEntry = esbuild.transformSync(browserEntry, {
  minify: true,
  target: 'es2017'
}).code.trim();

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(wrapperDistDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.js'), browserEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.min.js'), minifiedBrowserEntry);
fs.copyFileSync(vueRuntimeFile, path.join(wrapperDistDir, 'vue.min.js'));
fs.writeFileSync(path.join(wrapperDistDir, 'fabgrid-vue.js'), browserEntry);
fs.writeFileSync(path.join(wrapperDistDir, 'fabgrid-vue.min.js'), minifiedBrowserEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.esm.js'), esmEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.esm.min.js'), esbuild.transformSync(esmEntry, {
  format: 'esm',
  minify: true,
  target: 'es2017'
}).code.trim());

['fabgrid-vue.js', 'fabgrid-vue.min.js', 'fabgrid-vue.esm.js', 'fabgrid-vue.esm.min.js'].forEach(function(name) {
  if (!fs.existsSync(path.join(distDir, name)) || !fs.statSync(path.join(distDir, name)).size) throw new Error('Missing Vue wrapper output: ' + name);
});
['vue.min.js', 'fabgrid-vue.js', 'fabgrid-vue.min.js'].forEach(function(name) {
  if (!fs.existsSync(path.join(wrapperDistDir, name)) || !fs.statSync(path.join(wrapperDistDir, name)).size) {
    throw new Error('Missing shared Vue wrapper output: ' + name);
  }
});

console.log('Built FabGrid Vue 2 wrapper bundles.');
