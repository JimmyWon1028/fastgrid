import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfig, setConfig } from '../src/core/config.js';
import { resolveFabGridRequestCredentials } from '../src/grid/fabgrid.js';

test('FabUI global config stores request credentials without exposing mutable state', function() {
  var result;
  try {
    result = setConfig({
      request: {
        credentials: 'include'
      }
    });
    assert.equal(result.request.credentials, 'include');
    result.request.credentials = 'omit';
    assert.equal(getConfig().request.credentials, 'include');

    setConfig({
      request: {
        credentials: 'invalid'
      }
    });
    assert.equal(getConfig().request.credentials, 'same-origin');
  } finally {
    setConfig({
      request: {
        credentials: 'same-origin'
      }
    });
  }
});

test('FabGrid credentials prefer the instance option over global config', function() {
  var getGlobalConfig = function() {
    return {
      request: {
        credentials: 'include'
      }
    };
  };

  assert.equal(resolveFabGridRequestCredentials(undefined, getGlobalConfig), 'include');
  assert.equal(resolveFabGridRequestCredentials('omit', getGlobalConfig), 'omit');
  assert.equal(resolveFabGridRequestCredentials('same-origin', getGlobalConfig), 'same-origin');
  assert.equal(resolveFabGridRequestCredentials(undefined, null), 'same-origin');
});
