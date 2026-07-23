const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const minOnly = process.argv.slice(2).indexOf('min') >= 0;
const sourceFile = path.join(srcDir, 'htmleditor', 'htmleditor.js');
const styleFile = path.join(srcDir, 'htmleditor', 'htmleditor.css');
const iconFile = path.join(srcDir, 'fabui.icon.css');
const buildDate = new Date();
const buildVersion = buildDate.getFullYear() + '.' +
  (buildDate.getMonth() + 1) + '.' + buildDate.getDate();

function banner(name) {
  return '/*! FabUI HtmlEditor ' + name +
    ' | Optional extension; load FabUI core first */\n';
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

function extractHtmlEditorIcons(source) {
  const match = source.match(
    /\/\* HtmlEditor icons start \*\/[\s\S]*?\/\* HtmlEditor icons end \*\//
  );
  if (!match) throw new Error('HtmlEditor icon definitions are missing.');
  return match[0];
}

function verifyCoreDoesNotContainHtmlEditor() {
  const sourceEntry = fs.readFileSync(path.join(srcDir, 'fabui.js'), 'utf8');
  const sourceStyle = fs.readFileSync(path.join(srcDir, 'fabui.css'), 'utf8');
  const coreFile = path.join(distDir, 'fabui.js');
  const coreStyle = path.join(distDir, 'fabui.css');
  if (/HtmlEditor|htmleditor/i.test(sourceEntry) || /html-editor/i.test(sourceStyle)) {
    throw new Error('FabUI core source must not contain HtmlEditor.');
  }
  if (fs.existsSync(coreFile) && /global\.fabui\.HtmlEditor\s*=/.test(
    fs.readFileSync(coreFile, 'utf8')
  )) {
    throw new Error('FabUI core bundle must not publish HtmlEditor.');
  }
  if (fs.existsSync(coreStyle) && /\.fui-html-editor(?:[\s,{.:#>])/.test(
    fs.readFileSync(coreStyle, 'utf8')
  )) {
    throw new Error('FabUI core CSS must not contain HtmlEditor styles.');
  }
}

function createBrowserBundle(source) {
  return banner('browser global') +
    '(function(global) {\n' +
    "'use strict';\n" +
    'if (!global.fabui || typeof global.fabui.Control !== "function" ||\n' +
    '    typeof global.fabui.Control._registerControl !== "function" ||\n' +
    '    typeof global.fabui.Button !== "function" ||\n' +
    '    typeof global.fabui.Window !== "function" ||\n' +
    '    typeof global.fabui.EditBox !== "function" ||\n' +
    '    typeof global.fabui.CheckBox !== "function" ||\n' +
    '    typeof global.fabui.FileBox !== "function") {\n' +
    '  throw new Error("Load fabui.js before fabui.htmleditor.js.");\n' +
    '}\n' +
    source + '\n' +
    'global.fabui.HtmlEditor = createHtmlEditorFactory(global.fabui);\n' +
    'global.fabui.HtmlEditor.version = ' + JSON.stringify(buildVersion) + ';\n' +
    '}(typeof window !== "undefined" ? window : this));\n';
}

function verifyOutput() {
  const javascriptFile = path.join(
    distDir,
    minOnly ? 'fabui.htmleditor.min.js' : 'fabui.htmleditor.js'
  );
  const cssFile = path.join(
    distDir,
    minOnly ? 'fabui.htmleditor.min.css' : 'fabui.htmleditor.css'
  );
  const javascript = fs.readFileSync(javascriptFile, 'utf8');
  const css = fs.readFileSync(cssFile, 'utf8');
  if (javascript.indexOf('Load fabui.js before fabui.htmleditor.js.') < 0 ||
      (minOnly ?
        !/\.fabui\.HtmlEditor=/.test(javascript) :
        javascript.indexOf(
          'global.fabui.HtmlEditor = createHtmlEditorFactory'
        ) < 0)) {
    throw new Error('HtmlEditor browser global attachment is incomplete.');
  }
  if (!/\.fui-html-editor(?:[\s,{.:#>])/.test(css)) {
    throw new Error('HtmlEditor styles are missing.');
  }
  if (!/\.icon-html-editor-(?:style|link|picture|video)/.test(css)) {
    throw new Error('HtmlEditor toolbar icons are missing.');
  }
  if (fs.existsSync(path.join(distDir, 'fabui.htmleditor.esm.js')) ||
      fs.existsSync(path.join(distDir, 'fabui.htmleditor.esm.min.js'))) {
    throw new Error('HtmlEditor must not emit ESM distribution files.');
  }
  if (minOnly && (
    fs.existsSync(path.join(distDir, 'fabui.htmleditor.js')) ||
    fs.existsSync(path.join(distDir, 'fabui.htmleditor.css'))
  )) {
    throw new Error('HtmlEditor min build must not retain regular outputs.');
  }
}

verifyCoreDoesNotContainHtmlEditor();
fs.mkdirSync(distDir, { recursive: true });

const source = stripExports(fs.readFileSync(sourceFile, 'utf8'));
const styles = banner('styles') + fs.readFileSync(styleFile, 'utf8') + '\n' +
  extractHtmlEditorIcons(fs.readFileSync(iconFile, 'utf8'));
const browser = createBrowserBundle(source);

[
  'htmleditor.js',
  'htmleditor.min.js',
  'htmleditor.css',
  'htmleditor.min.css',
  'htmleditor.esm.js',
  'htmleditor.esm.min.js',
  'fabui.htmleditor.esm.js',
  'fabui.htmleditor.esm.min.js'
].forEach(function(file) {
  fs.rmSync(path.join(distDir, file), { force: true });
});

if (minOnly) {
  fs.rmSync(path.join(distDir, 'fabui.htmleditor.js'), { force: true });
  fs.rmSync(path.join(distDir, 'fabui.htmleditor.css'), { force: true });
} else {
  fs.writeFileSync(path.join(distDir, 'fabui.htmleditor.js'), browser, 'utf8');
  fs.writeFileSync(path.join(distDir, 'fabui.htmleditor.css'), styles, 'utf8');
}
fs.writeFileSync(
  path.join(distDir, 'fabui.htmleditor.min.js'),
  banner('browser global min') + minifyJs(browser),
  'utf8'
);
fs.writeFileSync(
  path.join(distDir, 'fabui.htmleditor.min.css'),
  minifyCss(styles),
  'utf8'
);

verifyOutput();
console.log(minOnly ?
  'Built minified optional FabUI HtmlEditor bundles.' :
  'Built optional FabUI HtmlEditor bundles.');
