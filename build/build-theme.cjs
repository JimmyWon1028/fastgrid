const path = require('path');
const { buildThemeOutput } = require('./theme-builder.cjs');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const unknownArgs = args.filter(function(arg) {
  return arg !== 'min';
});

if (unknownArgs.length) {
  throw new Error('Theme build only accepts the optional "min" argument.');
}

const result = buildThemeOutput({
  srcDir: path.join(root, 'src'),
  distDir: process.env.FABUI_DIST_DIR ? path.resolve(process.env.FABUI_DIST_DIR) : path.join(root, 'dist'),
  clean: true,
  minOnly: args.indexOf('min') >= 0
});

console.log(
  'Built ' + result.themeCount + ' FabUI themes' +
  (result.minOnly ? ' with minified CSS only.' : ' with regular and minified CSS.')
);
