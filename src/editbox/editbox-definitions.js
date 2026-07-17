export function createEditorDefinitions() {
  'use strict';

  function removeAll(text, token) {
    return token ? String(text).split(token).join('') : String(text);
  }

  function normalizePrecision(value) {
    if (value == null || value === false || value === '') return null;
    value = Math.floor(Number(value));
    return isFinite(value) && value >= 0 ? Math.min(20, value) : null;
  }

  function getGroupSeparator(options) {
    options = options || {};
    if (options.groupSeparator != null && options.groupSeparator !== '') return String(options.groupSeparator);
    if (options.thousandsSeparator === true || options.useThousandsSeparator === true || options.showThousandsSeparator === true) return ',';
    return '';
  }

  function getDecimalSeparator(options) {
    return options && options.decimalSeparator ? String(options.decimalSeparator) : '.';
  }

  function stripNumberFormatting(value, options) {
    var text = value == null ? '' : String(value).trim();
    var groupSeparator = getGroupSeparator(options);
    var decimalSeparator = getDecimalSeparator(options);
    text = removeAll(text, groupSeparator);
    if (decimalSeparator !== '.') text = text.replace(decimalSeparator, '.');
    return text.replace(/\s/g, '');
  }

  function sanitizeNumber(value, options) {
    var text = stripNumberFormatting(value, options);
    var output = '';
    var hasDecimal = false;
    var allowNegative = !options || options.min == null || Number(options.min) < 0;
    var index;
    var character;
    for (index = 0; index < text.length; index += 1) {
      character = text.charAt(index);
      if (character >= '0' && character <= '9') {
        output += character;
      } else if (character === '.' && !hasDecimal) {
        output += character;
        hasDecimal = true;
      } else if (character === '-' && allowNegative && output === '') {
        output = '-';
      }
    }
    return output;
  }

  function formatNumber(value, options) {
    var text = stripNumberFormatting(value, options);
    var precision = normalizePrecision(options && options.precision);
    var groupSeparator = getGroupSeparator(options);
    var decimalSeparator = getDecimalSeparator(options);
    var number;
    var sign = '';
    var hasDecimal;
    var parts;
    var integer;
    var decimal;
    if (text === '' || text === '-') return text;
    if (!/^-?\d*(?:\.\d*)?$/.test(text)) return String(value);
    if (precision != null) {
      number = Number(text);
      if (isFinite(number)) text = number.toFixed(precision);
    }
    if (text.charAt(0) === '-') {
      sign = '-';
      text = text.slice(1);
    }
    hasDecimal = text.indexOf('.') >= 0;
    parts = text.split('.');
    integer = parts[0] || '0';
    decimal = parts.length > 1 ? parts[1] : '';
    integer = integer.replace(/^0+(?=\d)/, '');
    if (groupSeparator) integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
    return sign + integer + (hasDecimal ? decimalSeparator + decimal : '');
  }

  function parseNumber(value, options) {
    var text = sanitizeNumber(value, options);
    var number;
    if (text === '' || text === '-' || text === '.' || text === '-.') return null;
    number = Number(text);
    return isFinite(number) ? number : null;
  }

  function isNumberTextAllowed(editor, text, options) {
    var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
    var end = editor.selectionEnd == null ? start : editor.selectionEnd;
    var next = editor.value.slice(0, start) + text + editor.value.slice(end);
    return stripNumberFormatting(next, options) === sanitizeNumber(next, options);
  }

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function parseDate(value) {
    var text;
    var match;
    var year;
    var month;
    var day;
    var date;
    if (value instanceof Date && isFinite(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (value == null || value === '') return null;
    text = String(value).trim();
    match = text.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/);
    if (!match) {
      match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (match) {
        year = Number(match[3]);
        month = Number(match[1]) - 1;
        day = Number(match[2]);
      }
    } else {
      year = Number(match[1]);
      month = Number(match[2]) - 1;
      day = Number(match[3]);
    }
    if (!match) return null;
    date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
  }

  function extractDateDigits(value) {
    var date = parseDate(value);
    if (date) return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate());
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 8);
  }

  function applyDateMask(raw, mask) {
    var digits = String(raw || '').replace(/[^0-9]/g, '').slice(0, 8);
    var output = '';
    var index = 0;
    var maskIndex;
    mask = String(mask || '9999/99/99');
    for (maskIndex = 0; maskIndex < mask.length; maskIndex += 1) {
      if (mask.charAt(maskIndex) === '9') {
        if (index >= digits.length) break;
        output += digits.charAt(index);
        index += 1;
      } else if (index > 0) {
        output += mask.charAt(maskIndex);
      }
    }
    return output;
  }

  function formatDate(value, options) {
    return applyDateMask(extractDateDigits(value), options && options.mask);
  }

  function getDateDataValue(value) {
    var date = parseDate(value);
    return date ? date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) : (value == null ? '' : String(value));
  }

  function getDateCopyText(value, options) {
    if (options && (options.autoUnmask === true || options.maskValueIncludesLiterals === false || options.maskIncludesLiterals === false || options.maskLiteralsInValue === false)) {
      return extractDateDigits(value);
    }
    return formatDate(value, options);
  }

  function countDateDigitsBeforeCaret(value, caret) {
    return String(value == null ? '' : value).slice(0, caret).replace(/[^0-9]/g, '').length;
  }

  function getDateCaretPosition(value, rawIndex) {
    var text = String(value || '');
    var count = 0;
    var index;
    if (rawIndex <= 0) return 0;
    for (index = 0; index < text.length; index += 1) {
      if (/[0-9]/.test(text.charAt(index))) {
        count += 1;
        if (count >= rawIndex) return index + 1;
      }
    }
    return text.length;
  }

  function handleDateDelete(editor, key, options) {
    var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
    var end = editor.selectionEnd == null ? start : editor.selectionEnd;
    var raw = extractDateDigits(editor.value);
    var deleteStart = countDateDigitsBeforeCaret(editor.value, start);
    var deleteEnd = countDateDigitsBeforeCaret(editor.value, end);
    var nextRaw;
    var nextText;
    var nextCaret;
    if (start === end) {
      if (key === 'Backspace') {
        if (deleteStart <= 0) return true;
        deleteStart -= 1;
      } else if (deleteStart >= raw.length) {
        return true;
      } else {
        deleteEnd += 1;
      }
    }
    nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
    nextText = applyDateMask(nextRaw, options && options.mask);
    nextCaret = getDateCaretPosition(nextText, deleteStart);
    editor.value = nextText;
    if (editor.setSelectionRange) editor.setSelectionRange(nextCaret, nextCaret);
    return true;
  }

  function parseYymm(value) {
    var text;
    var match;
    var year;
    var month;
    if (value instanceof Date && isFinite(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), 1);
    if (value == null || value === '') return null;
    text = String(value).trim();
    match = text.match(/^(\d{4})(?:[-\/](\d{1,2})|(\d{2}))$/);
    if (!match) return null;
    year = Number(match[1]);
    month = Number(match[2] || match[3]) - 1;
    return year >= 1 && month >= 0 && month <= 11 ? new Date(year, month, 1) : null;
  }

  function extractYymmDigits(value) {
    var date = parseYymm(value);
    if (date) return date.getFullYear() + pad2(date.getMonth() + 1);
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 6);
  }

  function formatYymm(value, options) {
    return applyDateMask(extractYymmDigits(value), options && options.mask ? options.mask : '9999/99');
  }

  function getYymmDataValue(value) {
    var date = parseYymm(value);
    return date ? date.getFullYear() + pad2(date.getMonth() + 1) : (value == null ? '' : String(value));
  }

  function getYymmCopyText(value, options) {
    if (options && (options.autoUnmask === true || options.maskValueIncludesLiterals === false || options.maskIncludesLiterals === false || options.maskLiteralsInValue === false)) {
      return extractYymmDigits(value);
    }
    return formatYymm(value, options);
  }

  function handleYymmDelete(editor, key, options) {
    var yymmOptions = {};
    var name;
    options = options || {};
    for (name in options) {
      if (Object.prototype.hasOwnProperty.call(options, name)) yymmOptions[name] = options[name];
    }
    yymmOptions.mask = options.mask || '9999/99';
    return handleDateDelete(editor, key, yymmOptions);
  }

  function isYearMonthMask(options) {
    var mask = options && options.mask ? String(options.mask) : '';
    return mask === '9999/99' || mask === '9999-99';
  }

  // CSS named colors use their standard sRGB hex values.
  var CSS_NAMED_COLORS = {
    aliceblue: 'f0f8ff',
    antiquewhite: 'faebd7',
    aqua: '00ffff',
    aquamarine: '7fffd4',
    azure: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '000000',
    blanchedalmond: 'ffebcd',
    blue: '0000ff',
    blueviolet: '8a2be2',
    brown: 'a52a2a',
    burlywood: 'deb887',
    cadetblue: '5f9ea0',
    chartreuse: '7fff00',
    chocolate: 'd2691e',
    coral: 'ff7f50',
    cornflowerblue: '6495ed',
    cornsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: '00ffff',
    darkblue: '00008b',
    darkcyan: '008b8b',
    darkgoldenrod: 'b8860b',
    darkgray: 'a9a9a9',
    darkgreen: '006400',
    darkgrey: 'a9a9a9',
    darkkhaki: 'bdb76b',
    darkmagenta: '8b008b',
    darkolivegreen: '556b2f',
    darkorange: 'ff8c00',
    darkorchid: '9932cc',
    darkred: '8b0000',
    darksalmon: 'e9967a',
    darkseagreen: '8fbc8f',
    darkslateblue: '483d8b',
    darkslategray: '2f4f4f',
    darkslategrey: '2f4f4f',
    darkturquoise: '00ced1',
    darkviolet: '9400d3',
    deeppink: 'ff1493',
    deepskyblue: '00bfff',
    dimgray: '696969',
    dimgrey: '696969',
    dodgerblue: '1e90ff',
    firebrick: 'b22222',
    floralwhite: 'fffaf0',
    forestgreen: '228b22',
    fuchsia: 'ff00ff',
    gainsboro: 'dcdcdc',
    ghostwhite: 'f8f8ff',
    gold: 'ffd700',
    goldenrod: 'daa520',
    gray: '808080',
    green: '008000',
    greenyellow: 'adff2f',
    grey: '808080',
    honeydew: 'f0fff0',
    hotpink: 'ff69b4',
    indianred: 'cd5c5c',
    indigo: '4b0082',
    ivory: 'fffff0',
    khaki: 'f0e68c',
    lavender: 'e6e6fa',
    lavenderblush: 'fff0f5',
    lawngreen: '7cfc00',
    lemonchiffon: 'fffacd',
    lightblue: 'add8e6',
    lightcoral: 'f08080',
    lightcyan: 'e0ffff',
    lightgoldenrodyellow: 'fafad2',
    lightgray: 'd3d3d3',
    lightgreen: '90ee90',
    lightgrey: 'd3d3d3',
    lightpink: 'ffb6c1',
    lightsalmon: 'ffa07a',
    lightseagreen: '20b2aa',
    lightskyblue: '87cefa',
    lightslategray: '778899',
    lightslategrey: '778899',
    lightsteelblue: 'b0c4de',
    lightyellow: 'ffffe0',
    lime: '00ff00',
    limegreen: '32cd32',
    linen: 'faf0e6',
    magenta: 'ff00ff',
    maroon: '800000',
    mediumaquamarine: '66cdaa',
    mediumblue: '0000cd',
    mediumorchid: 'ba55d3',
    mediumpurple: '9370db',
    mediumseagreen: '3cb371',
    mediumslateblue: '7b68ee',
    mediumspringgreen: '00fa9a',
    mediumturquoise: '48d1cc',
    mediumvioletred: 'c71585',
    midnightblue: '191970',
    mintcream: 'f5fffa',
    mistyrose: 'ffe4e1',
    moccasin: 'ffe4b5',
    navajowhite: 'ffdead',
    navy: '000080',
    oldlace: 'fdf5e6',
    olive: '808000',
    olivedrab: '6b8e23',
    orange: 'ffa500',
    orangered: 'ff4500',
    orchid: 'da70d6',
    palegoldenrod: 'eee8aa',
    palegreen: '98fb98',
    paleturquoise: 'afeeee',
    palevioletred: 'db7093',
    papayawhip: 'ffefd5',
    peachpuff: 'ffdab9',
    peru: 'cd853f',
    pink: 'ffc0cb',
    plum: 'dda0dd',
    powderblue: 'b0e0e6',
    purple: '800080',
    rebeccapurple: '663399',
    red: 'ff0000',
    rosybrown: 'bc8f8f',
    royalblue: '4169e1',
    saddlebrown: '8b4513',
    salmon: 'fa8072',
    sandybrown: 'f4a460',
    seagreen: '2e8b57',
    seashell: 'fff5ee',
    sienna: 'a0522d',
    silver: 'c0c0c0',
    skyblue: '87ceeb',
    slateblue: '6a5acd',
    slategray: '708090',
    slategrey: '708090',
    snow: 'fffafa',
    springgreen: '00ff7f',
    steelblue: '4682b4',
    tan: 'd2b48c',
    teal: '008080',
    thistle: 'd8bfd8',
    tomato: 'ff6347',
    transparent: '00000000',
    turquoise: '40e0d0',
    violet: 'ee82ee',
    wheat: 'f5deb3',
    white: 'ffffff',
    whitesmoke: 'f5f5f5',
    yellow: 'ffff00',
    yellowgreen: '9acd32'
  };

  function normalizeColor(value) {
    var text = value == null ? '' : String(value).trim().toLowerCase();
    var hex;
    if (!text) return '';
    if (Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, text)) {
      return '#' + CSS_NAMED_COLORS[text];
    }
    if (text.charAt(0) !== '#') text = '#' + text;
    hex = text.slice(1);
    if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return '';
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.replace(/./g, function(character) { return character + character; });
    }
    return '#' + hex;
  }

  function parseColor(value) {
    var text = value == null ? '' : String(value).trim();
    var normalized = normalizeColor(value);
    if (Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, text.toLowerCase())) {
      return text;
    }
    return normalized || text;
  }

  return {
    textbox: {
      type: 'textbox',
      className: 'textbox-f fg-editor-textbox',
      inputMode: 'text',
      normalize: function(value) { return value == null ? '' : String(value); }
    },
    numberbox: {
      type: 'numberbox',
      className: 'textbox-f numberbox-f fg-editor-numberbox',
      inputMode: 'decimal',
      normalizePrecision: normalizePrecision,
      getGroupSeparator: getGroupSeparator,
      stripFormatting: stripNumberFormatting,
      sanitize: sanitizeNumber,
      format: formatNumber,
      parse: parseNumber,
      getCopyText: stripNumberFormatting,
      isTextAllowed: isNumberTextAllowed
    },
    combobox: {
      type: 'combobox',
      className: 'textbox-f combobox-f fg-editor-combobox',
      inputMode: 'text',
      normalize: function(value) { return value == null ? '' : String(value); }
    },
    datebox: {
      type: 'datebox',
      className: 'textbox-f datebox-f fg-editor-datebox',
      inputMode: 'numeric',
      mask: '9999/99/99',
      sanitize: function(value, options) {
        return isYearMonthMask(options) ? formatYymm(value, options) : formatDate(value, options);
      },
      format: function(value, options) {
        return isYearMonthMask(options) ? formatYymm(value, options) : formatDate(value, options);
      },
      parse: function(value, options) {
        return isYearMonthMask(options) ? parseYymm(value) : parseDate(value);
      },
      getDataValue: function(value, options) {
        return isYearMonthMask(options) ? getYymmDataValue(value) : getDateDataValue(value);
      },
      getCopyText: function(value, options) {
        return isYearMonthMask(options) ? getYymmCopyText(value, options) : getDateCopyText(value, options);
      },
      handleDelete: function(editor, key, options) {
        return isYearMonthMask(options) ? handleYymmDelete(editor, key, options) : handleDateDelete(editor, key, options);
      },
      isTextAllowed: function(editor, text) { return /^[0-9]+$/.test(String(text || '')); }
    },
    color: {
      type: 'color',
      className: 'textbox-f color-f fg-editor-color',
      inputMode: 'text',
      normalize: normalizeColor,
      parse: parseColor,
      isValid: function(value) {
        return value == null || String(value).trim() === '' || Boolean(normalizeColor(value));
      }
    }
  };
}
