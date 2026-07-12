(function(root, factory) {
  var locale = factory();
  root.fabui = root.fabui || {};
  root.fabui.FabGridLocales = root.fabui.FabGridLocales || {};
  root.fabui.FabGridLocales.en = locale;
  if (root.fabui.FabGrid && root.fabui.FabGrid.addLocale) {
    root.fabui.FabGrid.addLocale('en', locale);
  }
}(typeof window !== 'undefined' ? window : this, function() {
  return {
    emptyText: 'No data',
    chart: { emptyText: 'No data', value: 'Value', percent: 'Percent' },
    exportBusyText: 'Exporting Excel...',
    workingText: 'Working...',
    loadMsg: 'Processing, please wait...',
    pagination: {
      ariaLabel: 'Pagination',
      pageSize: 'Page size',
      pageNumber: 'Page number',
      beforePageText: 'Page',
      afterPageText: 'of {pages}',
      displayMsg: 'Displaying {from} to {to} of {total} items',
      first: 'First page',
      previous: 'Previous page',
      next: 'Next page',
      last: 'Last page',
      refresh: 'Refresh'
    },
    validation: {
      invalidValue: 'Invalid value',
      invalidDate: 'Invalid date',
      invalidYearMonth: 'Invalid year and month',
      comboboxLimitToList: 'Please select a valid item'
    },
    aria: {
      cellEditor: 'Cell editor',
      openDatePicker: 'Open date picker',
      datePicker: 'Date picker',
      openComboBox: 'Open combo box',
      comboBoxOptions: 'Combo box options',
      openColumnChooser: 'Open column chooser',
      columnChooser: 'Column chooser',
      selectAllRows: 'Select all rows',
      selectRow: 'Select row {rowNumber}',
      year: 'Year'
    },
    filter: {
      startsWith: 'Starts with ({symbol})',
      contains: 'Contains ({symbol})',
      endsWith: 'Ends with ({symbol})',
      notStartsWith: 'Does not start with ({symbol})',
      notContains: 'Does not contain ({symbol})',
      notEndsWith: 'Does not end with ({symbol})',
      greaterThanOrEqual: '{symbol}',
      greaterThan: '{symbol}',
      lessThanOrEqual: '{symbol}',
      lessThan: '{symbol}',
      notEqual: '{symbol}',
      equal: '{symbol}',
      clear: 'Clear'
    },
    datebox: {
      today: 'Today',
      close: 'Close',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],
      monthTitle: '{month} {year}'
    }
  };
}));
