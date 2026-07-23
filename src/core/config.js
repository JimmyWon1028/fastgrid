var FABUI_CONFIG = {
  request: {
    credentials: 'same-origin'
  }
};

function normalizeGlobalRequestCredentials(value) {
  var credentials = String(value || '').toLowerCase();
  return credentials === 'include' || credentials === 'omit' ? credentials : 'same-origin';
}

export function getConfig() {
  return {
    request: {
      credentials: FABUI_CONFIG.request.credentials
    }
  };
}

export function setConfig(options) {
  var request = options && typeof options === 'object' ? options.request : null;
  if (request && typeof request === 'object' &&
      Object.prototype.hasOwnProperty.call(request, 'credentials')) {
    FABUI_CONFIG.request.credentials = normalizeGlobalRequestCredentials(request.credentials);
  }
  return getConfig();
}
