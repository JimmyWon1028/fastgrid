const fs = require('fs');
const path = require('path');

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function copyThemeImages(sourceDir, outputDir, monoImagesDir) {
  fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(function(entry) {
    const source = path.join(sourceDir, entry.name);
    const output = path.join(outputDir, entry.name);
    if (!entry.isDirectory() || entry.name === '.DS_Store') return;
    if (entry.name === 'images') {
      if (path.resolve(source) === monoImagesDir) return;
      fs.cpSync(source, output, {
        recursive: true,
        filter: function(file) {
          return path.basename(file) !== '.DS_Store';
        }
      });
      return;
    }
    copyThemeImages(source, output, monoImagesDir);
  });
}

function rewriteThemeUrls(source, sourceFile, sourceThemeDir) {
  return source.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, function(match, quote, url) {
    const cleanUrl = url.replace(/[?#].*$/, '');
    const suffix = url.slice(cleanUrl.length);
    const asset = path.resolve(path.dirname(sourceFile), cleanUrl);
    let relative;
    if (/^(?:data:|https?:|#)/i.test(url) || !fs.existsSync(asset) || !fs.statSync(asset).isFile()) {
      return match;
    }
    relative = path.relative(sourceThemeDir, asset).split(path.sep).join('/');
    if (relative.indexOf('mono/images/') === 0) {
      relative = relative.replace('mono/images/', 'mono/');
    }
    return 'url("' + relative + suffix + '")';
  });
}

function bundleThemeCss(entryFile, sourceThemeDir, seen) {
  const absolute = path.resolve(entryFile);
  let source;
  seen = seen || {};
  if (seen[absolute]) return '';
  seen[absolute] = true;
  source = fs.readFileSync(absolute, 'utf8');
  source = source.replace(
    /@import\s+(?:url\()?(['"])([^'"]+\.css)(?:[?#][^'"]*)?\1\)?\s*;/g,
    function(match, quote, request) {
      return bundleThemeCss(path.resolve(path.dirname(absolute), request), sourceThemeDir, seen);
    }
  );
  return rewriteThemeUrls(source, absolute, sourceThemeDir);
}

function verifyCssAssets(file) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceDir = path.dirname(file);
  const missing = [];
  source.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, function(match, quote, url) {
    const assetUrl = url.replace(/[?#].*$/, '');
    const asset = path.resolve(sourceDir, assetUrl);
    if (/^(?:data:|https?:|#)/i.test(url)) return match;
    if (!fs.existsSync(asset) || !fs.statSync(asset).isFile()) missing.push(url);
    return match;
  });
  if (missing.length) {
    throw new Error('Missing built theme assets in ' + path.basename(file) + ': ' + missing.join(', '));
  }
}

function buildThemeOutput(options) {
  const srcDir = path.resolve(options.srcDir);
  const distDir = path.resolve(options.distDir);
  const sourceThemeDir = path.join(srcDir, 'theme');
  const outputThemeDir = path.join(distDir, 'theme');
  const monoImagesDir = path.join(sourceThemeDir, 'mono', 'images');
  const minOnly = options.minOnly === true;
  const sourceFiles = fs.readdirSync(sourceThemeDir, { withFileTypes: true })
    .filter(function(entry) {
      return entry.isFile() &&
        /^fabgrid\..+\.css$/i.test(entry.name) &&
        entry.name !== 'fabgrid.default.css';
    })
    .map(function(entry) {
      return entry.name;
    })
    .sort();

  if (sourceFiles.length !== 18) {
    throw new Error('Theme build requires exactly 18 non-default theme source files.');
  }

  if (options.clean === true) {
    fs.rmSync(outputThemeDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputThemeDir, { recursive: true });

  sourceFiles.forEach(function(file) {
    const source = path.join(sourceThemeDir, file);
    const outputName = file.replace(/^fabgrid\./i, 'fabui.');
    const output = path.join(outputThemeDir, outputName);
    const css = bundleThemeCss(source, sourceThemeDir);
    if (/\.fg-theme-[A-Za-z0-9-]+/.test(css)) {
      throw new Error('Theme output must use fixed component selectors: ' + file);
    }
    if (!minOnly) {
      fs.writeFileSync(output, css, 'utf8');
    }
    fs.writeFileSync(output.replace(/\.css$/i, '.min.css'), minifyCss(css), 'utf8');
  });

  copyThemeImages(sourceThemeDir, outputThemeDir, monoImagesDir);
  fs.cpSync(monoImagesDir, path.join(outputThemeDir, 'mono'), {
    recursive: true,
    filter: function(file) {
      return path.basename(file) !== '.DS_Store';
    }
  });

  sourceFiles.forEach(function(file) {
    const outputName = file.replace(/^fabgrid\./i, 'fabui.');
    const output = path.join(outputThemeDir, outputName);
    const minOutput = output.replace(/\.css$/i, '.min.css');
    if (!fs.existsSync(minOutput)) {
      throw new Error('Missing minified theme output: ' + path.basename(minOutput));
    }
    if (minOnly && fs.existsSync(output)) {
      throw new Error('Theme min build retained a non-minified file: ' + path.basename(output));
    }
    if (!minOnly && !fs.existsSync(output)) {
      throw new Error('Missing theme output: ' + path.basename(output));
    }
    verifyCssAssets(minOutput);
    if (!minOnly) verifyCssAssets(output);
  });

  return {
    minOnly: minOnly,
    outputDir: outputThemeDir,
    themeCount: sourceFiles.length
  };
}

module.exports = {
  buildThemeOutput: buildThemeOutput
};
