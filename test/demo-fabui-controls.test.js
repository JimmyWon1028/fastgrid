import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

var demoDirectory = new URL('../demo/', import.meta.url);
var devHelperScript = readFileSync(
  new URL('../demo/js/dev-controls.js', import.meta.url),
  'utf8'
);
var distHelperScript = readFileSync(
  new URL('../demo/js/dist-controls.js', import.meta.url),
  'utf8'
);
var helperScript = readFileSync(
  new URL('../demo/js/demo-controls.js', import.meta.url),
  'utf8'
);

function getBuildPages() {
  return readdirSync(demoDirectory)
    .filter(function(name) {
      return /\.html$/.test(name) &&
        !/^dev/.test(name) &&
        name !== 'index.html' &&
        !/vue2/.test(name);
    });
}

function readAttribute(source, name) {
  var match = source.match(new RegExp('\\b' + name + '="([^"]*)"'));
  return match ? match[1] : '';
}

function normalizeShowcaseText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/開發版|正式版|Build Demo|Build|Source-mode：|Build-mode：/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readShowcaseSignature(html) {
  var bodyMatch = html.match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);
  var bodyAttributes = bodyMatch ? bodyMatch[1] : '';
  var body = bodyMatch ? bodyMatch[2] : '';
  var markup = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  var ids = Array.from(markup.matchAll(/\bid="([^"]+)"/g))
    .map(function(match) {
      return match[1];
    });
  var inputs = Array.from(markup.matchAll(/<input\b([^>]*)>/gi))
    .map(function(match) {
      return {
        id: readAttribute(match[1], 'id'),
        type: readAttribute(match[1], 'type') || 'text',
        checked: /\bchecked(?:\s|>|$)/.test(match[1])
      };
    });
  var selects = Array.from(
    markup.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)
  ).map(function(match) {
    return {
      id: readAttribute(match[1], 'id'),
      options: Array.from(match[2].matchAll(/<option\b([^>]*)>/gi))
        .map(function(optionMatch) {
          return {
            value: readAttribute(optionMatch[1], 'value'),
            selected: /\bselected(?:\s|>|$)/.test(optionMatch[1])
          };
        })
    };
  });
  var textBlocks = Array.from(
    markup.matchAll(/<(h[1-3]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi)
  ).map(function(match) {
    return normalizeShowcaseText(match[2]);
  }).filter(Boolean);

  return {
    toolbarIconOnly: readAttribute(
      bodyAttributes,
      'data-grid-toolbar-icon-only'
    ),
    ids: ids,
    inputs: inputs,
    selects: selects,
    textBlocks: textBlocks
  };
}

function readShowcasePairs() {
  var devIndex = readFileSync(new URL('dev.html', demoDirectory), 'utf8');

  return Array.from(devIndex.matchAll(
    /<tr><td>(.*?)<\/td><td><a href="\.\/(dev-[^"]+)">.*?<\/a><\/td><td><a href="\.\/([^"]+)">.*?<\/a><\/td><\/tr>/g
  )).map(function(match) {
    return {
      label: match[1],
      dev: match[2],
      build: match[3]
    };
  });
}

test('Every source-mode Demo loads the shared FabUI control enhancer', function() {
  var pages = readdirSync(demoDirectory)
    .filter(function(name) {
      return /^dev-.*\.html$/.test(name);
    });

  assert.ok(pages.length > 0);
  pages.forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.match(
      html,
      /<script type="module" src="\.\/js\/dev-controls\.js\?v=20260719-(?:select-fit|button-icon)-v1"><\/script>/,
      name
    );
  });
});

test('The shared enhancer uses FabUI controls for native Demo fields', function() {
  assert.match(devHelperScript, /from '\.\.\/\.\.\/src\/fabui\.js/);
  assert.match(distHelperScript, /mountFabUIDemoControls\(window\.fabui,/);
  assert.match(helperScript, /new fabui\.Button\(button,/);
  assert.match(helperScript, /a\[data-fabui-button\]/);
  assert.match(helperScript, /a\[href="javascript:void\(0\)"\]/);
  assert.match(helperScript, /new fabui\.EditBox\(select,/);
  assert.match(helperScript, /new fabui\.EditBox\(input,/);
  assert.match(helperScript, /new fabui\.CheckBox\(input,/);
  assert.match(helperScript, /new fabui\.RadioButton\(input,/);
  assert.match(helperScript, /new fabui\.FileBox\(input,/);
  assert.match(
    helperScript,
    /iconCls:\s*button\.getAttribute\('data-icon-cls'\)\s*\|\|\s*''/
  );
  assert.match(helperScript, /theme:\s*'inherit'/);
  assert.match(helperScript, /\.fui-combobox-panel/);
  assert.match(helperScript, /\.fui-colorbox-panel/);
  assert.match(helperScript, /\.fui-datebox-panel/);
});

test('The shared enhancer fits Combo EditBox width to every select option', function() {
  assert.match(helperScript, /function measureSelectContentWidth\(select, control\)/);
  assert.match(helperScript, /Array\.prototype\.forEach\.call\(select\.options,/);
  assert.match(helperScript, /\.fui-combobox-arrow/);
  assert.match(helperScript, /control\.resize\(/);
  assert.match(
    helperScript,
    /control\.loadData\(readSelectData\(select\), true\);[\s\S]*?fitSelectWidth\(select, control, size\.width\);/
  );
});

test('Every build-mode Demo loads dist FabUI and the shared control enhancer', function() {
  var pages = getBuildPages();

  assert.ok(pages.length > 0);
  pages.forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.match(
      html,
      /<script src="\.\.\/dist\/fabui(?:\.min)?\.js(?:\?[^"]*)?"><\/script>/,
      name
    );
    assert.match(
      html,
      /<script type="module" src="\.\/js\/dist-controls\.js\?v=20260719-all-demos-v1"><\/script>/,
      name
    );
    assert.doesNotMatch(html, /\.\.\/src\//, name);
  });
});

test('Source-mode Demo Button hosts use anchors consistently', function() {
  var pages = readdirSync(demoDirectory)
    .filter(function(name) {
      return /^dev-.*\.html$/.test(name);
    });

  pages.forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.doesNotMatch(html, /<button\b/i, name);
    Array.from(html.matchAll(/<a\b[^>]*data-fabui-button[^>]*>/gi))
      .forEach(function(match) {
        assert.match(match[0], /\bhref="javascript:void\(0\)"/, name);
      });
  });
});

test('Build-mode Demo Button hosts use anchors consistently', function() {
  getBuildPages().forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    assert.doesNotMatch(html, /<button\b/i, name);
  });
});

test('Build-mode Demo inline styles do not repaint native control descendants', function() {
  getBuildPages().forEach(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    var styles = Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/g))
      .map(function(match) {
        return match[1];
      })
      .join('\n');

    Array.from(styles.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      .forEach(function(match) {
        var selector = match[1].trim();
        var targetsNativeControl = /(^|[\s>+~,])(button|select|input|textarea)(?=$|[\s.:#\[\]>+~,])/.test(selector);
        assert.equal(
          targetsNativeControl,
          false,
          name + ': ' + selector
        );
      });
  });
});

test('Demo indexes expose source-mode and build-mode pages separately', function() {
  var indexHtml = readFileSync(new URL('index.html', demoDirectory), 'utf8');
  var devHtml = readFileSync(new URL('dev.html', demoDirectory), 'utf8');

  assert.doesNotMatch(indexHtml, /<th>開發版<\/th>/);
  assert.doesNotMatch(indexHtml, /href=["']\.\/dev-[^"']*\.html["']/i);
  assert.match(indexHtml, /<th>正式版<\/th>/);
  assert.match(indexHtml, /href=["']\.\/grid\.html["']/i);
  assert.match(devHtml, /<th>開發版<\/th>/);
  assert.match(devHtml, /<th>正式版<\/th>/);
  assert.match(devHtml, /href=["']\.\/dev-grid\.html["']/i);
  assert.match(devHtml, /href=["']\.\/grid\.html["']/i);
  assert.doesNotMatch(
    indexHtml + devHtml,
    /(?:src|href)=["'][^"']*(?:src|dist)\/fabui|data-fabui-button|class=["'][^"']*\bfui-button\b/i
  );
  assert.doesNotMatch(indexHtml + devHtml, /<script\b/i);
});

test('Every build-mode Demo mirrors its source-mode showcase', function() {
  var pairs = readShowcasePairs();

  assert.equal(pairs.length, 30);
  pairs.forEach(function(pair) {
    var devHtml = readFileSync(new URL(pair.dev, demoDirectory), 'utf8');
    var buildHtml = readFileSync(new URL(pair.build, demoDirectory), 'utf8');

    assert.deepEqual(
      readShowcaseSignature(buildHtml),
      readShowcaseSignature(devHtml),
      pair.label + ': ' + pair.dev + ' <=> ' + pair.build
    );
  });
});

test('Source-mode Demo styles do not repaint FabUI button hosts', function() {
  var pages = readdirSync(demoDirectory)
    .filter(function(name) {
      return /^dev-.*\.html$/.test(name);
    });
  var styleDirectory = new URL('../demo/style/', import.meta.url);
  var sources = pages.map(function(name) {
    var html = readFileSync(new URL(name, demoDirectory), 'utf8');
    var styles = Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/g))
      .map(function(match) {
        return match[1];
      })
      .join('\n');
    return { name: name, css: styles };
  });

  readdirSync(styleDirectory)
    .filter(function(name) {
      return /\.css$/.test(name);
    })
    .forEach(function(name) {
      sources.push({
        name: 'style/' + name,
        css: readFileSync(new URL(name, styleDirectory), 'utf8')
      });
    });

  sources.forEach(function(source) {
    Array.from(source.css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      .forEach(function(match) {
        var selector = match[1].trim();
        var declarations = match[2];
        var targetsButton = /(^|[\s>+~,])button(?=$|[\s.:#\[\]>+~,])/.test(selector);
        var excludesFabUIButton = /:not\(\.fui-button\)/.test(selector);
        var isGridInternal = /\.tree-filter-input-wrap\s+button/.test(selector);
        var repaintsButton = /(?:^|;)\s*(?:background|border(?:-[\w-]+)?|color|font(?:-[\w-]+)?|height|min-height|padding(?:-[\w-]+)?)\s*:/.test(declarations);
        assert.equal(
          targetsButton && !excludesFabUIButton && !isGridInternal && repaintsButton,
          false,
          source.name + ': ' + selector
        );
      });
  });
});
