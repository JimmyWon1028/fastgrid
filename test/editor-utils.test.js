import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMask,
  countMaskCharactersBeforeCaret,
  extractMaskCharacters,
  getMaskCaretPosition,
  getMaskCopyText,
  isMaskAutoUnmask
} from '../src/grid/fabgrid-editor.js';
import { isPromiseLike, normalizeValidationResult } from '../src/grid/fabgrid-editor.js';

test('mask helpers format and extract date values', function() {
  assert.equal(applyMask('20260712', '9999/99/99'), '2026/07/12');
  assert.equal(extractMaskCharacters('2026/07/12', '9999/99/99'), '20260712');
  assert.equal(countMaskCharactersBeforeCaret('2026/07', '9999/99/99', 7), 6);
  assert.equal(getMaskCaretPosition('2026/07/12', '9999/99/99', 6), 7);
});

test('mask copy respects literal configuration aliases', function() {
  assert.equal(getMaskCopyText('20260712', { mask: '9999/99/99' }), '2026/07/12');
  assert.equal(getMaskCopyText('2026/07/12', { mask: '9999/99/99', autoUnmask: true }), '20260712');
  assert.equal(isMaskAutoUnmask({ maskValueIncludesLiterals: false }), true);
});

test('validation results normalize supported return types', function() {
  assert.equal(normalizeValidationResult(false, 1, 'custom', 'Invalid'), null);
  assert.deepEqual(normalizeValidationResult('Required', '', 'custom', 'Invalid'), {
    type: 'custom', message: 'Required', value: ''
  });
  assert.deepEqual(normalizeValidationResult({ message: 'Too small', minimum: 1 }, 0, 'number', 'Invalid'), {
    type: 'number', message: 'Too small', value: 0, minimum: 1
  });
  assert.equal(isPromiseLike(Promise.resolve()), true);
  assert.equal(isPromiseLike({}), false);
});
