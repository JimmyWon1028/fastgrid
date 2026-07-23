import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

test('default build compiles FabUI core without wrapper bundles', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var buildSource = fs.readFileSync('build/build.cjs', 'utf8');
  var themeBuilderSource = fs.readFileSync('build/theme-builder.cjs', 'utf8');
  var smokeSource = fs.readFileSync('build/smoke.cjs', 'utf8');

  assert.equal(packageJson.scripts.build, 'node build/build.cjs');
  assert.doesNotMatch(
    buildSource,
    /rmSync\(distDir,\s*\{\s*recursive:\s*true/
  );
  assert.match(buildSource, /'fabui\.js',[\s\S]*'fabui\.min\.css'/);
  assert.match(
    buildSource,
    /rmSync\(path\.join\(distDir, 'theme'\), \{ recursive: true, force: true \}\)/
  );
  assert.match(buildSource, /'editbox\/time-editbox\.js'/);
  assert.match(buildSource, /'core\/config\.js'/);
  assert.match(buildSource, /global\.fabui\.setConfig = setConfig/);
  assert.match(buildSource, /global\.fabui\.getConfig = getConfig/);
  assert.match(buildSource, /buildThemeOutput\(\{/);
  assert.match(themeBuilderSource, /path\.join\(outputThemeDir, 'mono'\)/);
  assert.match(
    smokeSource,
    /\(\?:diagram\|lite\|gantt\|scheduler\|htmleditor\)/
  );
  assert.doesNotMatch(smokeSource, /wrapper outputs are incomplete/);
  assert.doesNotMatch(smokeSource, /'wrapper'/);
});

test('all build commands omit ESM output files', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var buildScripts = [
    'build/build.cjs',
    'build/build-lite.cjs',
    'build/build-diagram.cjs',
    'build/build-gantt.cjs',
    'build/build-scheduler.cjs',
    'build/build-htmleditor.cjs',
    'build/build-theme.cjs',
    'build/build-vue.cjs',
    'build/build-jquery.cjs'
  ];
  var vuePackage = JSON.parse(fs.readFileSync('packages/fabgrid-vue/package.json', 'utf8'));
  var jqueryPackage = JSON.parse(fs.readFileSync('packages/fabgrid-jquery/package.json', 'utf8'));

  assert.equal(packageJson.module, undefined);
  assert.equal(vuePackage.module, undefined);
  assert.equal(jqueryPackage.module, undefined);
  buildScripts.forEach(function(filePath) {
    var source = fs.readFileSync(filePath, 'utf8');
    assert.doesNotMatch(source, /format:\s*['"]esm['"]/, filePath);
    assert.doesNotMatch(source, /writeFileSync\([\s\S]{0,160}\.esm\./, filePath);
  });
});

test('theme build supports regular and min-only isolated output', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabui-theme-build-'));
  var sentinel = path.join(tempDir, 'fabui.lite.min.js');
  var result;
  var themeFiles;

  assert.equal(packageJson.scripts['build:theme'], 'node build/build-theme.cjs');
  fs.writeFileSync(sentinel, 'keep', 'utf8');
  try {
    result = spawnSync(process.execPath, ['build/build-theme.cjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    themeFiles = fs.readdirSync(path.join(tempDir, 'theme'));
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.css$/i.test(file) && !/\.min\.css$/i.test(file);
    }).length, 18);
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.min\.css$/i.test(file);
    }).length, 18);
    assert.equal(themeFiles.includes('fabui.default.css'), false);

    result = spawnSync(process.execPath, ['build/build-theme.cjs', 'min'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    themeFiles = fs.readdirSync(path.join(tempDir, 'theme'));
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.min\.css$/i.test(file);
    }).length, 18);
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.css$/i.test(file) && !/\.min\.css$/i.test(file);
    }).length, 0);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
    assert.equal(fs.existsSync(path.join(tempDir, 'theme', 'mono', 'pagination-next.svg')), true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Lite build keeps Mono family assets in the shared flat directory', function() {
  var buildSource = fs.readFileSync('build/build-lite.cjs', 'utf8');

  assert.match(buildSource, /replace\('theme\/mono\/images\/', 'theme\/mono\/'\)/);
  assert.match(
    buildSource,
    /rmSync\(path\.join\(distDir, 'theme', 'mono', 'images'\), \{ recursive: true, force: true \}\)/
  );
});

test('Lite build supports min-only isolated output', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabui-lite-build-'));
  var sentinel = path.join(tempDir, 'fabui.min.js');
  var result;
  var context;

  assert.equal(packageJson.scripts['build:lite'], 'node build/build-lite.cjs');
  fs.writeFileSync(sentinel, 'keep', 'utf8');
  try {
    result = spawnSync(process.execPath, ['build/build-lite.cjs', 'min'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.min.js')), true);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.min.css')), true);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.js')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.css')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.esm.js')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.esm.min.js')), false);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
    context = {};
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(tempDir, 'fabui.lite.min.js'), 'utf8'), context);
    assert.equal(typeof context.fabui.FabGrid, 'function');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('EditBox jQuery wrapper remains removed', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var removedPaths = [
    'build/build-editbox-jquery.cjs',
    'demo/dev-editbox-jquery.html',
    'demo/editbox-jquery.html',
    'demo/js/editbox-jquery-demo.js',
    'dist/wrapper/fabeditbox-jquery.min.js',
    'docs/editbox-jquery-api.md',
    'packages/fabeditbox-jquery/index.d.ts',
    'packages/fabeditbox-jquery/package.json',
    'packages/fabeditbox-jquery/dist/fabeditbox-jquery.js',
    'packages/fabeditbox-jquery/src/fabeditbox-jquery.js',
    'test/editbox-jquery-wrapper.test.js'
  ];

  assert.equal(packageJson.scripts['build:editbox-jquery'], undefined);
  assert.equal(packageJson.scripts['build:jquery'], 'node build/build-jquery.cjs');
  removedPaths.forEach(function(filePath) {
    assert.equal(fs.existsSync(filePath), false, filePath + ' should not exist');
  });
});

test('build command contract supports comma-separated scopes', function() {
  var agents = fs.readFileSync('AGENTS.md', 'utf8');
  var readme = fs.readFileSync('README.md', 'utf8');

  assert.match(agents, /`build`／`build fabui`/);
  assert.match(agents, /`build <scope>,<scope> \[min\]`/);
  assert.match(agents, /`build fabui,htmleditor min`/);
  assert.match(agents, /`build htmleditor min`/);
  assert.match(agents, /逗號左右不得有空白/);
  assert.match(agents, /`all` 與 `clear` 必須單獨使用/);
  assert.match(readme, /`build fabui,htmleditor min`/);
  assert.match(
    readme,
    /`build htmleditor min` 對應 `npm run build:htmleditor -- min`/
  );
  assert.match(
    readme,
    /`dist\/fabui\.htmleditor\.min\.js` 與 `dist\/fabui\.htmleditor\.min\.css`/
  );
  assert.match(
    readme,
    /`fabui`、`lite`、`diagram`、`gantt`、`scheduler`、`htmleditor`、`theme`/
  );
});
