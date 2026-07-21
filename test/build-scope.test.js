import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('default build compiles FabUI core without wrapper bundles', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var buildSource = fs.readFileSync('build/build.cjs', 'utf8');
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
  assert.match(buildSource, /path\.join\(outputThemeDir, 'mono'\)/);
  assert.doesNotMatch(smokeSource, /wrapper outputs are incomplete/);
  assert.doesNotMatch(smokeSource, /'wrapper'/);
});

test('all build commands omit ESM output files', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var buildScripts = [
    'build/build.cjs',
    'build/build-lite.cjs',
    'build/build-gantt.cjs',
    'build/build-scheduler.cjs',
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

test('Lite build keeps Mono family assets in the shared flat directory', function() {
  var buildSource = fs.readFileSync('build/build-lite.cjs', 'utf8');

  assert.match(buildSource, /replace\('theme\/mono\/images\/', 'theme\/mono\/'\)/);
  assert.match(
    buildSource,
    /rmSync\(path\.join\(distDir, 'theme', 'mono', 'images'\), \{ recursive: true, force: true \}\)/
  );
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
  assert.match(agents, /`build fabui,diagram min`/);
  assert.match(agents, /逗號左右不得有空白/);
  assert.match(agents, /`all` 與 `clear` 必須單獨使用/);
  assert.match(readme, /`build fabui,diagram min`/);
  assert.match(readme, /`fabui`、`lite`、`diagram`、`gantt`、`scheduler`、`theme`/);
});
