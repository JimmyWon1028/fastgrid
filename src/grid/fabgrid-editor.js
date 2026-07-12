export function getMaskCopyText(value, column) {
  return isMaskValueIncludingLiterals(column) ? formatMaskText(value, column) : extractMaskCharacters(value, column.mask);
}

export function formatMaskText(value, column) {
  return applyMask(extractMaskCharacters(value, column.mask), column.mask);
}

export function countMaskCharactersBeforeCaret(value, mask, caret) {
  return extractMaskCharacters(String(value == null ? '' : value).slice(0, caret), mask).length;
}

export function getMaskCaretPosition(value, mask, rawIndex) {
  var text = String(value == null ? '' : value);
  var tokenIndex = 0;
  var tokens = getMaskTokens(mask);
  var i;
  var ch;
  if (rawIndex <= 0) {
    return 0;
  }
  for (i = 0; i < text.length && tokenIndex < tokens.length; i += 1) {
    ch = text.charAt(i);
    if (isMaskCharAllowed(ch, tokens[tokenIndex])) {
      tokenIndex += 1;
      if (tokenIndex >= rawIndex) {
        return i + 1;
      }
    }
  }
  return text.length;
}

export function isMaskValueIncludingLiterals(column) {
  return !isMaskAutoUnmask(column);
}

export function isMaskAutoUnmask(column) {
  if (column.autoUnmask === true) {
    return true;
  }
  if (column.autoUnmask === false) {
    return false;
  }
  return column.maskValueIncludesLiterals === false ||
    column.maskIncludesLiterals === false ||
    column.maskLiteralsInValue === false;
}

export function extractMaskCharacters(value, mask) {
  var text = value == null ? '' : String(value);
  var chars = [];
  var tokenIndex = 0;
  var tokens = getMaskTokens(mask);
  var i;
  var ch;
  if (!mask || !tokens.length) {
    return text;
  }
  for (i = 0; i < text.length && tokenIndex < tokens.length; i += 1) {
    ch = text.charAt(i);
    if (isMaskCharAllowed(ch, tokens[tokenIndex])) {
      chars.push(ch);
      tokenIndex += 1;
    }
  }
  return chars.join('');
}

export function applyMask(raw, mask) {
  var value = raw == null ? '' : String(raw);
  var output = '';
  var rawIndex = 0;
  var i;
  var token;
  var ch;
  if (!mask) {
    return value;
  }
  for (i = 0; i < mask.length; i += 1) {
    token = getMaskToken(mask.charAt(i));
    if (!token) {
      if (rawIndex > 0) {
        output += mask.charAt(i);
      }
      continue;
    }
    ch = findNextMaskChar(value, rawIndex, token);
    if (!ch) {
      break;
    }
    output += ch.value;
    rawIndex = ch.nextIndex;
  }
  return output;
}

export function getMaskTokens(mask) {
  var tokens = [];
  var i;
  var token;
  for (i = 0; i < String(mask || '').length; i += 1) {
    token = getMaskToken(mask.charAt(i));
    if (token) {
      tokens.push(token);
    }
  }
  return tokens;
}

export function isMaskCharAllowed(ch, token) {
  if (token === 'digit') return /[0-9]/.test(ch);
  if (token === 'letter') return /[A-Za-z]/.test(ch);
  if (token === 'alphanumeric') return /[0-9A-Za-z]/.test(ch);
  return false;
}

function findNextMaskChar(value, start, token) {
  var i;
  var ch;
  for (i = start; i < value.length; i += 1) {
    ch = value.charAt(i);
    if (isMaskCharAllowed(ch, token)) {
      return { value: ch, nextIndex: i + 1 };
    }
  }
  return null;
}

function getMaskToken(ch) {
  if (ch === '9') return 'digit';
  if (ch === 'A') return 'letter';
  if (ch === '*') return 'alphanumeric';
  return '';
}

export function isPromiseLike(value) {
  return value && typeof value.then === 'function';
}

export function normalizeValidationResult(result, value, type, defaultMessage) {
  var base;
  var key;
  if (result == null || result === false || result === '') {
    return null;
  }
  base = {
    type: type || 'custom',
    message: defaultMessage || 'Invalid value',
    value: value
  };
  if (typeof result === 'string') {
    base.message = result;
    return base;
  }
  if (result === true) {
    return base;
  }
  if (typeof result === 'object') {
    for (key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        base[key] = result[key];
      }
    }
    return base;
  }
  return null;
}
