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
    }
  });
});

test('Script-rendered Grid demos use default theme settings', function() {
  var gridSource = fs.readFileSync(path.join(demoDirectory, 'js/grid.js'), 'utf8');
  var vueSource = fs.readFileSync(path.join(demoDirectory, 'js/grid-vue2.vue'), 'utf8');
  assert.match(gridSource, /DEFAULT_DEMO_SETTINGS\s*=\s*\{[\s\S]*?theme:\s*"default"/);
  assert.match(vueSource, /data:\s*function\s*\(\)\s*\{[\s\S]*?theme:\s*"default"/);
});
