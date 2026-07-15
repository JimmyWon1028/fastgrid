// Shared Grid demo data.
(function(global) {
  'use strict';

  var WORKFLOW_VALUES = ['draft', 'pending', 'approved', 'closed'];
  var ROW_COUNT = 2000;
  var COLUMN_COUNT = 21;
  var VENDORS = [
    { code: '408042', name: '全得' },
    { code: '724001', name: '凱士' },
    { code: '114021', name: '凱銳' },
    { code: '307018', name: '翔曜' },
    { code: '520033', name: '瑞禾' }
  ];
  var DESCRIPTIONS = [
    '第一期工程款20%(未稅金額)',
    '第二期工程款60%(未稅金額)',
    '第三期工程款20%(未稅金額)',
    '工程款30%訂金',
    '工程款30%中款'
  ];
  var LOOKUP_CODES = ['2W001', 'WU001', 'CU004', 'BV001', 'RM001', 'RW001', 'JL001', 'JP001'];
  var LOOKUP_ROWS = [
    {
      code: '2W001',
      orderNo: 'SE260701003',
      customer: 'EG00',
      name: '高陞旺',
      qty: 4000,
      available: 4000,
      price: 454.2,
      status: '買單'
    },
    {
      code: 'WU001',
      orderNo: 'SE260701002',
      customer: 'CU00',
      name: '和碩',
      qty: 8000,
      available: 3097.8,
      price: 454.2,
      status: '買單'
    },
    {
      code: 'CU004',
      orderNo: 'SE260701001',
      customer: '2R00',
      name: '大晉',
      qty: 3000,
      available: 2092.6,
      price: 429.9,
      status: '買單'
    },
    {
      code: 'BV001',
      orderNo: 'SE260526001',
      customer: 'CU00',
      name: '和碩',
      qty: 3658.9,
      available: 0,
      price: 450.4,
      status: '使用'
    },
    {
      code: 'RM001',
      orderNo: 'SE260501001',
      customer: '2R00',
      name: '大晉',
      qty: 3000,
      available: -1250,
      price: 408.8,
      status: '使用,結案'
    },
    {
      code: 'RW001',
      orderNo: 'SE151117001',
      customer: 'C500',
      name: '宏展',
      qty: 20000,
      available: 20000,
      price: 177,
      status: '買單'
    },
    {
      code: 'JL001',
      orderNo: 'SE150714001',
      customer: 'C500',
      name: '宏展',
      qty: 72446.4,
      available: 72446.4,
      price: 183,
      status: '買單'
    },
    {
      code: 'JP001',
      orderNo: 'SE150216001',
      customer: 'C500',
      name: '宏展',
      qty: 3000,
      available: 3000,
      price: 200,
      status: '使用,結案'
    }
  ];
  var COLORS = ['#ff0000', '#ff9900', '#ffd966', '#70ad47', '#00b0f0', '#4472c4', '#7030a0', '#c00000cc'];

  function createRows(count, columnCount, options) {
    var exactRowCount = options && options.exactRowCount === true;
    var rows = [];
    var row;
    var vendor;
    var groupIndex;
    var lineInGroup;
    var groupSize;
    var orderNo;
    var i;
    var c;
    for (i = 1; exactRowCount ? rows.length < count : i <= count; i += 1) {
      groupIndex = Math.floor((i - 1) / 3);
      lineInGroup = (i - 1) % 3;
      groupSize = groupIndex % 5 === 0 ? 1 : 3;
      vendor = VENDORS[groupIndex % VENDORS.length];
      orderNo = 'BO' + (2025000000 + groupIndex * 1005 + 27);
      row = {
        facno: vendor.code,
        name: vendor.name,
        region: '',
        crncy: 'NTD',
        category: pad((lineInGroup + 1) * 10),
        refCode: orderNo,
        dlvno: orderNo,
        item: pad((lineInGroup + 1) * 10),
        cusno: LOOKUP_CODES[(groupIndex + lineInGroup) % LOOKUP_CODES.length],
        stus: WORKFLOW_VALUES[(groupIndex + lineInGroup) % WORKFLOW_VALUES.length],
        color: COLORS[(groupIndex + lineInGroup) % COLORS.length],
        rem: DESCRIPTIONS[(groupIndex + lineInGroup) % DESCRIPTIONS.length],
        amount: groupSize === 1 ? 6700 : Math.round(((groupIndex + 3) * 374398.33) / groupSize),
        score: (i * 17) % 100,
        dlvdt: createTextDateValue(i),
        yearMonth: createYearMonthValue(i),
        yymm: createYearMonthValue(i),
        date: createOrderDateValue(groupIndex)
      };
      for (c = 10; c <= columnCount; c += 1) {
        row['col' + pad(c)] = c % 4 === 0 ? (i * c) % 10000 : 'R' + i + '-C' + c;
      }
      rows.push(row);
      if (groupSize === 1) {
        i += 2;
      }
    }
    return rows;
  }

  function createOrderDateValue(index) {
    var day = (index % 26) + 1;
    var month = index % 3 === 0 ? 4 : 5;
    return '2026-' + pad(month) + '-' + pad(day);
  }

  function createTextDateValue(index) {
    if (index % 9 === 0) {
      return '2025' + pad((index % 12) + 1) + pad((index % 28) + 1);
    }
    if (index % 5 === 0) {
      return '202606' + pad((index % 28) + 1);
    }
    return '202607' + pad((index % 28) + 1);
  }

  function createYearMonthValue(index) {
    if (index % 9 === 0) {
      return '2025' + pad((index % 12) + 1);
    }
    if (index % 5 === 0) {
      return '202606';
    }
    return '202607';
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  global.FabGridDemoData = {
    rowCount: ROW_COUNT,
    columnCount: COLUMN_COUNT,
    rows: createRows(ROW_COUNT, COLUMN_COUNT, { exactRowCount: true }),
    lookupRows: LOOKUP_ROWS,
    workflowValues: WORKFLOW_VALUES.slice()
  };
}(window));
