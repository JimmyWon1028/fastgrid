import test from 'node:test';
import assert from 'node:assert/strict';
import { PivotEngine } from '../src/pivot/pivot-engine.js';
import { getPivotSlicerValues } from '../src/pivot/pivot-slicer.js';

test('PivotSlicer returns stable distinct field values from the source', function() {
  var engine = new PivotEngine({
    itemsSource: [
      { region: 'North', sales: 10 },
      { region: 'South', sales: 20 },
      { region: 'North', sales: 30 }
    ],
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'sales', header: 'Sales', dataType: 'number' }
    ],
    rowFields: ['Region'],
    valueFields: ['Sales']
  });

  assert.deepEqual(getPivotSlicerValues(engine, engine.getField('Region')), ['North', 'South']);
});
