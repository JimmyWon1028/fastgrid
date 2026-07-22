(function(global) {
  'use strict';

  var themes = [
    'default',
    'black',
    'bootstrap',
    'cupertino',
    'dark-hive',
    'material',
    'material-blue',
    'material-teal',
    'metro',
    'metro-blue',
    'metro-gray',
    'metro-green',
    'metro-orange',
    'metro-red',
    'pepper-grinder',
    'sunny',
    'mono',
    'mono-red',
    'mono-green'
  ];
  var parameters = new URLSearchParams(global.location.search);
  var requestedTheme = String(parameters.get('theme') || 'default').toLowerCase();
  var themeCssVersion = '20260722-filter-active-theme-v1';
  var baseLink = Array.prototype.find.call(
    document.querySelectorAll('link[rel="stylesheet"]'),
    function(link) {
      return /\/(?:src|dist)\/fabui(?:\.lite)?(?:\.min)?\.css(?:[?#]|$)/.test(link.href);
    }
  );

  if (themes.indexOf(requestedTheme) < 0) requestedTheme = 'default';

  function isThemeSelector(element) {
    var id = String(element && element.id || '').toLowerCase();
    var name = String(element && element.name || '').toLowerCase();
    if (!element || element.tagName !== 'SELECT') return false;
    if (id.indexOf('themebuilder') >= 0) return false;
    return id.indexOf('theme') >= 0 || name === 'theme';
  }

  function getThemeHref(theme) {
    var href = baseLink.href;
    var sourceMode = /\/src\/fabui(?:\.lite)?(?:\.min)?\.css/.test(href);
    var themeHref = sourceMode ?
      new URL('theme/fabgrid.' + theme + '.css', href).href :
      new URL('theme/fabui.' + theme + '.css', href).href;
    themeHref = new URL(themeHref);
    themeHref.searchParams.set('v', themeCssVersion);
    return themeHref.href;
  }

  function reload(theme) {
    var url = new URL(global.location.href);
    theme = themes.indexOf(theme) >= 0 ? theme : 'default';
    if (theme === 'default') url.searchParams.delete('theme');
    else url.searchParams.set('theme', theme);
    global.location.assign(url.href);
  }

  if (baseLink && requestedTheme !== 'default') {
    var themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = getThemeHref(requestedTheme);
    themeLink.setAttribute('data-fabui-theme', requestedTheme);
    baseLink.insertAdjacentElement('afterend', themeLink);
  }

  document.addEventListener('change', function(event) {
    if (!isThemeSelector(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    reload(String(event.target.value || 'default').toLowerCase());
  }, true);

  document.addEventListener('DOMContentLoaded', function() {
    if (themeLink) document.head.appendChild(themeLink);
    Array.prototype.forEach.call(document.querySelectorAll('select'), function(select) {
      if (!isThemeSelector(select)) return;
      if (Array.prototype.some.call(select.options, function(option) {
        return option.value === requestedTheme;
      })) {
        select.value = requestedTheme;
      }
    });
  });

  global.fabuiDemoTheme = {
    current: requestedTheme,
    reload: reload,
    themes: themes.slice()
  };
}(window));
