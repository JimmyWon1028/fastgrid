import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PivotAggregate,
  PivotEngine,
  PivotField,
  PivotShowAs,
  PivotShowTotals
} from '../src/pivot/pivot-engine.js';

function createSalesEngine(options) {
  var rows = [
    { region: 'North', product: 'A', channel: 'Web', sales: 10, orders: 1 },
    { region: 'North', product: 'B', channel: 'Web', sales: 20, orders: 2 },
    { region: 'South', product: 'A', channel: 'Store', sales: 30, orders: 3 },
    { region: 'South', product: 'B', channel: 'Web', sales: 40, orders: 4 }
  ];
  return new PivotEngine(Object.assign({
    itemsSource: rows,
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'product', header: 'Product' },
      { binding: 'channel', header: 'Channel' },
      { binding: 'sales', header: 'Sales', dataType: 'number', aggregate: 'Sum' },
      { binding: 'orders', header: 'Orders', dataType: 'number', aggregate: 'Average' }
    ],
    rowFields: ['Region', 'Product'],
    columnFields: ['Channel'],
    valueFields: ['Sales', 'Orders'],
    showRowTotals: 'Subtotals',
    showColumnTotals: 'GrandTotals'
  }, options || {}));
}

function getCell(engine, rowPath, columnPath, fieldKey) {
  var rowIndex = engine.pivotView.rowEntries.findIndex(function(entry) {
    return JSON.stringify(entry.path) === JSON.stringify(rowPath);
  });
  var dataColumn = engine.pivotView.dataColumns.find(function(column) {
    return JSON.stringify(column.entry.path) === JSON.stringify(columnPath) && column.valueField.key === fieldKey;
  });
  return engine.pivotView.rows[rowIndex][dataColumn.binding];
}

test('PivotField selects practical aggregate defaults', function() {
  var numberField = new PivotField(null, 'amount', 'Amount', { dataType: 'number' });
  var textField = new PivotField(null, 'name', 'Name', { dataType: 'string' });

  assert.equal(numberField.aggregate, PivotAggregate.Sum);
  assert.equal(textField.aggregate, PivotAggregate.Count);
});

test('PivotEngine creates leaf, subtotal, and grand total aggregates', function() {
  var engine = createSalesEngine();

  assert.equal(engine.showRowTotals, PivotShowTotals.Subtotals);
  assert.equal(getCell(engine, ['North', 'A'], ['Web'], 'Sales'), 10);
  assert.equal(getCell(engine, ['North'], ['Web'], 'Sales'), 30);
  assert.equal(getCell(engine, [], [], 'Sales'), 100);
  assert.equal(getCell(engine, ['South'], [], 'Orders'), 3.5);
  assert.equal(engine.pivotView.rowEntries.filter(function(entry) { return entry.isSubtotal; }).length, 2);
  assert.equal(engine.pivotView.rowEntries.filter(function(entry) { return entry.isGrandTotal; }).length, 1);
});

test('PivotEngine averages only numeric values', function() {
  var engine = new PivotEngine({
    itemsSource: [
      { group: 'A', amount: 10 },
      { group: 'A', amount: 'invalid' },
      { group: 'A', amount: 20 }
    ],
    fields: [
      { binding: 'group', header: 'Group' },
      { binding: 'amount', header: 'Amount', dataType: 'number', aggregate: 'Average' }
    ],
    rowFields: ['Group'],
    valueFields: ['Amount'],
    showRowTotals: 'None',
    showColumnTotals: 'None'
  });

  assert.equal(getCell(engine, ['A'], [], 'Amount'), 15);
});

test('PivotEngine supports calculated fields and weighted averages', function() {
  var engine = new PivotEngine({
    itemsSource: [
      { group: 'A', quantity: 2, price: 10 },
      { group: 'A', quantity: 1, price: 40 }
    ],
    fields: [
      { binding: 'group', header: 'Group' },
      {
        key: 'Revenue',
        header: 'Revenue',
        dataType: 'number',
        calculate: function(item) { return item.quantity * item.price; }
      },
      {
        binding: 'price',
        header: 'Weighted Price',
        dataType: 'number',
        aggregate: 'WeightedAverage',
        weightBinding: 'quantity'
      }
    ],
    rowFields: ['Group'],
    valueFields: ['Revenue', 'Weighted Price'],
    showRowTotals: 'None',
    showColumnTotals: 'None'
  });

  assert.equal(getCell(engine, ['A'], [], 'Revenue'), 60);
  assert.equal(getCell(engine, ['A'], [], 'Weighted Price'), 20);
  assert.equal(engine.getField('Weighted Price').aggregate, PivotAggregate.WeightedAverage);
});

test('PivotEngine applies percent and running total ShowAs modes', function() {
  var engine = new PivotEngine({
    itemsSource: [
      { region: 'North', quarter: 'Q1', sales: 10 },
      { region: 'North', quarter: 'Q2', sales: 30 },
      { region: 'South', quarter: 'Q1', sales: 60 }
    ],
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'quarter', header: 'Quarter' },
      {
        binding: 'sales',
        header: 'Sales',
        dataType: 'number',
        showAs: PivotShowAs.PercentOfGrandTotal
      }
    ],
    rowFields: ['Region'],
    columnFields: ['Quarter'],
    valueFields: ['Sales'],
    showRowTotals: 'GrandTotals',
    showColumnTotals: 'GrandTotals'
  });

  assert.equal(getCell(engine, ['North'], ['Q1'], 'Sales'), 0.1);
  assert.equal(getCell(engine, ['South'], ['Q1'], 'Sales'), 0.6);

  engine.getField('Sales').showAs = PivotShowAs.RunningTotal;
  engine.refresh();
  assert.equal(getCell(engine, ['North'], ['Q1'], 'Sales'), 10);
  assert.equal(getCell(engine, ['North'], ['Q2'], 'Sales'), 40);
});

test('PivotEngine refreshAsync reports progress and preserves synchronous refresh', async function() {
  var engine = createSalesEngine();
  var progress = [];

  engine.progress.addHandler(function(sender, args) {
    if (args.async) progress.push(args.progress);
  });
  engine.itemsSource.push({ region: 'East', product: 'A', channel: 'Web', sales: 50, orders: 5 });
  await engine.refreshAsync({ batchSize: 2 });

  assert.equal(getCell(engine, [], [], 'Sales'), 150);
  assert.equal(progress.length >= 3, true);
  assert.equal(progress[progress.length - 1], 1);
  assert.equal(engine.isUpdating, false);
  assert.equal(engine.refresh(), engine.pivotView);
});

test('PivotEngine can cancel an asynchronous refresh without replacing the current view', async function() {
  var engine = createSalesEngine();
  var previousView = engine.pivotView;
  var pending = engine.refreshAsync({ batchSize: 1 });

  assert.equal(engine.cancelRefresh(), true);
  await assert.rejects(pending, function(error) {
    return error && error.name === 'AbortError';
  });
  assert.equal(engine.pivotView, previousView);
  assert.equal(engine.isUpdating, false);
});

test('PivotEngine deferUpdate supports asynchronous callbacks', async function() {
  var engine = createSalesEngine();
  var updatedCalls = 0;

  engine.updatedView.addHandler(function() {
    updatedCalls += 1;
  });
  await engine.deferUpdate(async function() {
    engine.setViewFields('rowFields', ['Region'], false);
    await Promise.resolve();
    engine.setViewFields('columnFields', ['Product'], false);
  });

  assert.equal(updatedCalls, 1);
  assert.deepEqual(engine.rowFields.map(function(field) { return field.key; }), ['Region']);
  assert.deepEqual(engine.columnFields.map(function(field) { return field.key; }), ['Product']);
});

test('PivotEngine applies field filters before aggregation and returns matching detail', function() {
  var engine = createSalesEngine();
  var region = engine.getField('Region');
  var row;
  var column;
  var detail;

  region.filter = { values: ['North'] };
  engine.refresh();
  assert.equal(getCell(engine, [], [], 'Sales'), 30);

  row = engine.pivotView.rows.find(function(item) {
    return JSON.stringify(item.__pivotMeta.path) === JSON.stringify(['North', 'A']);
  });
  column = engine.pivotView.dataColumns.find(function(item) {
    return JSON.stringify(item.entry.path) === JSON.stringify(['Web']) && item.valueField.key === 'Sales';
  });
  detail = engine.getDetail(row, column);
  assert.equal(detail.length, 1);
  assert.equal(detail[0].sales, 10);
});

test('PivotEngine supports date grouping and descending dimension order', function() {
  var engine = new PivotEngine({
    itemsSource: [
      { date: new Date(2026, 0, 1), amount: 1 },
      { date: new Date(2026, 6, 1), amount: 2 }
    ],
    fields: [
      { key: 'quarter', binding: 'date', header: 'Quarter', groupBy: 'Quarter', descending: true },
      { binding: 'amount', header: 'Amount', dataType: 'number' }
    ],
    rowFields: ['quarter'],
    valueFields: ['Amount'],
    showRowTotals: 'None',
    showColumnTotals: 'None'
  });

  assert.deepEqual(engine.pivotView.rowEntries.map(function(entry) { return entry.path[0]; }), [
    '2026 Q3',
    '2026 Q1'
  ]);
});

test('PivotEngine dimension sorting cycles natural, ascending, and descending order', function() {
  var engine = new PivotEngine({
    itemsSource: [
      { region: 'North', sales: 10 },
      { region: 'Central', sales: 20 },
      { region: 'East', sales: 30 }
    ],
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'sales', header: 'Sales', dataType: 'number' }
    ],
    rowFields: ['Region'],
    valueFields: ['Sales'],
    showRowTotals: 'None',
    showColumnTotals: 'None'
  });
  var field = engine.getField('Region');

  function values() {
    return engine.pivotView.rowEntries.map(function(entry) { return entry.path[0]; });
  }

  assert.equal(field.sortDirection, 0);
  assert.deepEqual(values(), ['North', 'Central', 'East']);
  field.sortDirection = 1;
  engine.refresh();
  assert.deepEqual(values(), ['Central', 'East', 'North']);
  field.sortDirection = -1;
  engine.refresh();
  assert.deepEqual(values(), ['North', 'East', 'Central']);
  field.sortDirection = 0;
  engine.refresh();
  assert.deepEqual(values(), ['North', 'Central', 'East']);
});

test('PivotEngine viewDefinition can be serialized and restored', function() {
  var engine = createSalesEngine();
  engine.getField('Region').filter = { values: ['North'] };
  engine.getField('Region').sortDirection = -1;
  var definition = JSON.parse(JSON.stringify(engine.viewDefinition));
  var restored = new PivotEngine({ itemsSource: engine.itemsSource });

  restored.viewDefinition = definition;
  assert.deepEqual(restored.rowFields.map(function(field) { return field.key; }), ['Region', 'Product']);
  assert.deepEqual(restored.columnFields.map(function(field) { return field.key; }), ['Channel']);
  assert.deepEqual(restored.valueFields.map(function(field) { return field.key; }), ['Sales', 'Orders']);
  assert.deepEqual(restored.getField('Region').filter, { values: ['North'] });
  assert.equal(restored.getField('Region').sortDirection, -1);
  assert.equal(getCell(restored, [], [], 'Sales'), 30);
});

test('PivotEngine restores serialized Date filter values by value', function() {
  var firstDate = new Date(2026, 0, 1);
  var secondDate = new Date(2026, 1, 1);
  var engine = new PivotEngine({
    itemsSource: [
      { date: firstDate, amount: 10 },
      { date: secondDate, amount: 20 }
    ],
    fields: [
      { binding: 'date', header: 'Date', dataType: 'date', filter: { values: [firstDate] } },
      { binding: 'amount', header: 'Amount', dataType: 'number' }
    ],
    rowFields: ['Date'],
    valueFields: ['Amount']
  });
  var definition = JSON.parse(JSON.stringify(engine.viewDefinition));
  var restored = new PivotEngine({
    itemsSource: engine.itemsSource
  });

  restored.viewDefinition = definition;
  assert.equal(restored.pivotView.filteredCount, 1);
  assert.equal(restored.pivotView.rows[0].__pivotMeta.path[0].getTime(), firstDate.getTime());
});

test('PivotEngine setFields rebinds active view areas to the new field instances', function() {
  var engine = createSalesEngine();
  var oldRowField = engine.rowFields[0];
  var changedEvents = 0;

  engine.viewDefinitionChanged.addHandler(function() {
    changedEvents += 1;
  });
  engine.setFields([
    { binding: 'region', key: 'Region', header: 'Sales Region' },
    { binding: 'product', key: 'Product', header: 'Product' },
    { binding: 'channel', key: 'Channel', header: 'Channel' },
    { binding: 'sales', key: 'Sales', header: 'Sales', dataType: 'number' },
    { binding: 'orders', key: 'Orders', header: 'Orders', dataType: 'number', aggregate: 'Average' }
  ]);

  assert.notEqual(engine.rowFields[0], oldRowField);
  assert.equal(engine.rowFields[0], engine.getField('Region'));
  assert.equal(engine.rowFields[0].header, 'Sales Region');
  assert.equal(engine.valueFields[0], engine.getField('Sales'));
  assert.equal(changedEvents, 1);
});

test('PivotEngine exposes compatible updatedView and native events', function() {
  var engine = createSalesEngine();
  var compatibleCalls = 0;
  var nativeCalls = 0;

  engine.updatedView.addHandler(function(sender, args) {
    compatibleCalls += 1;
    assert.equal(sender, engine);
    assert.equal(args.pivotView, engine.pivotView);
  });
  engine.on('updatedView', function(args) {
    nativeCalls += 1;
    assert.equal(args.pivotView, engine.pivotView);
  });
  engine.refresh();

  assert.equal(compatibleCalls, 1);
  assert.equal(nativeCalls, 1);
});
