import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

var demoDirectory = path.resolve('demo');
var demoFiles = fs.readdirSync(demoDirectory)
  .filter(function(file) {
    return file.endsWith('.html');
  })
  .sort();

test('Every HTML demo starts with the default theme', function() {
  demoFiles.forEach(function(file) {
    var source = fs.readFileSync(path.join(demoDirectory, file), 'utf8');
    var body = source.match(/<body\b[^>]*>/i);
    assert.ok(body, file + ' must contain a body element');
    assert.match(
      body[0],
      /\bclass=["'][^"']*\bfg-theme-default\b[^"']*["']/i,
      file + ' must start with fg-theme-default'
    );
  });
});

test('Every explicit demo theme selector selects default', function() {
  demoFiles.forEach(function(file) {
    var source = fs.readFileSync(path.join(demoDirectory, file), 'utf8');
    var selectPattern = /<select\b[^>]*(?:id|name)=["'][^"']*theme[^"']*["'][^>]*>([\s\S]*?)<\/select>/gi;
    var match;
    while ((match = selectPattern.exec(source))) {
      var defaultOption = match[1].match(
        /<option\b(?=[^>]*\bvalue=["']default["'])[^>]*>/i
      );
      assert.ok(defaultOption, file + ' theme selector must contain default');
      assert.match(
        defaultOption[0],
        /\bselected\b/i,
        file + ' theme selector must select default'
      );
      assert.match(
        match[1],
        /<option\b(?=[^>]*\bvalue=["']mono-red["'])[^>]*>\s*Mono Red\s*<\/option>/i,
        file + ' theme selector must contain Mono Red'
      );
      assert.match(
        match[1],
        /<option\b(?=[^>]*\bvalue=["']mono-green["'])[^>]*>\s*Mono Green\s*<\/option>/i,
        file + ' theme selector must contain Mono Green'
      );
    }
  });
});

test('EditBox source and build demos expose the shared Calendar theme selector', function() {
  [
    'dev-editbox.html',
    'editbox.html'
  ].forEach(function(file) {
    var source = fs.readFileSync(path.join(demoDirectory, file), 'utf8');
    assert.match(
      source,
      /<select\b[^>]*\bid=["']calendar-theme["'][^>]*>/i,
      file + ' must expose the Calendar theme selector required by editbox-demo.js'
    );
  });
});

test('Script-rendered Grid demos use default theme settings', function() {
  var gridSource = fs.readFileSync(path.join(demoDirectory, 'js/grid.js'), 'utf8');
  var vueSource = fs.readFileSync(path.join(demoDirectory, 'js/grid-vue2.vue'), 'utf8');
  assert.match(gridSource, /DEFAULT_DEMO_SETTINGS\s*=\s*\{[\s\S]*?theme:\s*"default"/);
  assert.match(vueSource, /data:\s*function\s*\(\)\s*\{[\s\S]*?theme:\s*"default"/);
});

test('Popup Grid Window body keeps the grid and pager in a vertical layout', function() {
  var source = fs.readFileSync(path.join(demoDirectory, 'style/grid2.css'), 'utf8');
  var windowBodyRule = source.match(
    /\.grid2-demo\s+\.lookup-popup-window\.fui-window-body\s*\{([\s\S]*?)\}/
  );
  var pagerRule = source.match(
    /\.grid2-demo\s+\.lookup-popup-window\s+\.lookup-popup-pager\s*\{([\s\S]*?)\}/
  );
  assert.ok(windowBodyRule, 'Popup Grid Window body rule must exist');
  assert.match(windowBodyRule[1], /flex-direction:\s*column/);
  assert.ok(pagerRule, 'Popup Grid pager rule must exist');
  assert.match(pagerRule[1], /white-space:\s*nowrap/);
});

test('Popup Grid refreshes its viewport after Window size state changes', function() {
  var source = fs.readFileSync(
    path.join(demoDirectory, 'js/grid2-components.js'),
    'utf8'
  );
  assert.match(
    source,
    /fabui\.Control\.getControl\(host\.querySelector\("\.lookup-popup-grid"\)\)/
  );
  assert.match(source, /onResize:\s*refreshLookupGridLayout/);
  assert.match(source, /onMaximize:\s*refreshLookupGridLayout/);
  assert.match(source, /onRestore:\s*refreshLookupGridLayout/);
  assert.match(source, /setTimeout\(function\s*\(\)\s*\{[\s\S]*?\},\s*240\)/);
});

test('Pure JavaScript Grid toolbar supports icon-only development buttons', function() {
  var devGridSource = fs.readFileSync(
    path.join(demoDirectory, 'dev-grid.html'),
    'utf8'
  );
  var gridSource = fs.readFileSync(
    path.join(demoDirectory, 'js/grid.js'),
    'utf8'
  );
  var componentSource = fs.readFileSync(
    path.join(demoDirectory, 'js/grid2-components.js'),
    'utf8'
  );
  var styleSource = fs.readFileSync(
    path.join(demoDirectory, 'style/grid2.css'),
    'utf8'
  );
  var toolbarButtonRule = styleSource.match(
    /\.grid2-demo\s+\.toolbar\s+\.grid2-toolbar-button\s*,\s*\.grid2-demo\s+\.toolbar\s+\.toolbar-icon-button\.fui-button\s*\{([\s\S]*?)\}/
  );
  assert.match(
    gridSource,
    /labels\.exportCsv\.textContent\s*=\s*toolbarIconOnly\s*\?\s*""\s*:\s*getDemoText\("exportCsv"\)/
  );
  assert.match(
    gridSource,
    /labels\.exportExcel\.textContent\s*=\s*toolbarIconOnly\s*\?\s*""\s*:\s*getDemoText\("exportExcel"\)/
  );
  assert.match(
    gridSource,
    /labels\.fullscreen\.textContent\s*=\s*toolbarIconOnly\s*\?\s*""\s*:\s*text/
  );
  assert.match(
    devGridSource,
    /data-grid-toolbar-icon-only=["']true["']/
  );
  assert.match(
    componentSource,
    /width:\s*toolbarIconOnly\s*\?\s*34\s*:\s*null/
  );
  assert.ok(toolbarButtonRule, 'Grid toolbar Button sizing rule must exist');
  assert.match(toolbarButtonRule[1], /flex:\s*0\s+0\s+auto/);
  assert.match(toolbarButtonRule[1], /width:\s*auto/);
  assert.match(
    styleSource,
    /data-grid-toolbar-icon-only=["']true["'][\s\S]*?flex-basis:\s*34px[\s\S]*?width:\s*34px/
  );
});
