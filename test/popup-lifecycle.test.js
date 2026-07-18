import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function readMethod(source, type, name) {
  var marker = type + '.prototype.' + name + ' = function';
  var start = source.indexOf(marker);
  var end;
  assert.notEqual(start, -1, marker + ' must exist');
  end = source.indexOf('\n};', start);
  assert.notEqual(end, -1, marker + ' must end');
  return source.slice(start, end + 3);
}

[
  {
    file: 'src/editbox/date-popup.js',
    type: 'DatePopup',
    documentEvent: 'mousedown'
  },
  {
    file: 'src/editbox/combo-popup.js',
    type: 'ComboPopup',
    documentEvent: 'pointerdown'
  },
  {
    file: 'src/editbox/color-popup.js',
    type: 'ColorPopup',
    documentEvent: 'pointerdown'
  }
].forEach(function(config) {
  test(config.type + ' binds global listeners only while open', function() {
    var source = fs.readFileSync(config.file, 'utf8');
    var bind = readMethod(source, config.type, '_bind');
    var bindOpen = readMethod(source, config.type, '_bindOpenEvents');
    var unbindOpen = readMethod(source, config.type, '_unbindOpenEvents');
    var show = readMethod(source, config.type, 'show');
    var hide = readMethod(source, config.type, 'hide');
    assert.doesNotMatch(bind, /document\.addEventListener|window\.addEventListener/);
    assert.match(
      bindOpen,
      new RegExp("document\\.addEventListener\\(['\"]" + config.documentEvent)
    );
    assert.match(bindOpen, /window\.addEventListener\(['"]scroll['"]/);
    assert.match(unbindOpen, /document\.removeEventListener/);
    assert.match(unbindOpen, /window\.removeEventListener\(['"]scroll['"]/);
    assert.match(show, /this\._bindOpenEvents\(\)/);
    assert.match(hide, /this\._unbindOpenEvents\(\)/);
  });
});
