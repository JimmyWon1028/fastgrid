import fabui from '../../src/fabui.js?v=20260721-initial-filter-rules-v1';
import { mountFabUIDemoControls } from './demo-controls.js?v=20260721-initial-filter-rules-v1';

window.setTimeout(function() {
  mountFabUIDemoControls(fabui, 'fabuiDevControls');
}, 0);
