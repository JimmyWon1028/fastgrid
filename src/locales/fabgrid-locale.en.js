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
    tree: {
      contextMenuAriaLabel: 'TreeGrid expand and collapse',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all'
    },
    pivot: {
      grandTotal: 'Grand Total',
      total: 'Total',
      expandGroup: 'Expand group',
      collapseGroup: 'Collapse group',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all',
      showDetail: 'Show detail',
      detailTitle: 'Detail records',
      detailCount: '{count} records',
      closeDetail: 'Close detail',
      sortAscending: 'Sort ascending',
      sortDescending: 'Sort descending',
      clearSort: 'Clear sort',
      aggregate: 'Aggregate',
      removeField: 'Remove field',
      filteredValues: 'Filtered',
      chart: {
        ariaLabel: 'Pivot chart',
        title: 'Pivot Chart',
        pointsTruncated: 'Showing {count} of {total} categories',
        seriesTruncated: 'Showing {count} of {total} series'
      },
      workspace: {
        ariaLabel: 'Pivot analysis workspace',
        panelTitle: 'Define View',
        gridTitle: 'Pivot Grid',
        chartTitle: 'Pivot Chart',
        panelSplitter: 'Resize definition pane',
        chartSplitter: 'Resize chart pane',
        hidePanel: 'Hide Definition',
        showPanel: 'Show Definition',
        hideChart: 'Hide Chart',
        showChart: 'Show Chart',
        gridFullscreen: 'Pivot Grid fullscreen',
        chartFullscreen: 'Pivot Chart fullscreen',
        exitFullscreen: 'Exit fullscreen',
        chartType: 'Chart type',
        progress: 'Aggregating {progress}%',
        cancel: 'Cancel',
        cancelled: 'Aggregation cancelled',
        error: 'Aggregation failed',
        chartTypes: {
          column: 'Column',
          bar: 'Bar',
          line: 'Line',
          pie: 'Pie'
        }
      },
      panel: {
        ariaLabel: 'Pivot view settings',
        fields: 'Fields',
        filters: 'Filters',
        rows: 'Rows',
        columns: 'Columns',
        values: 'Values',
        allValues: 'All',
        filterField: 'Filter {field}',
        aggregateMenu: 'Value aggregation settings',
        aggregateField: 'Set aggregation for {field}',
        sortMenu: 'Dimension sorting settings',
        sortField: 'Set sorting for {field}',
        sortDefault: 'Default order',
        filterMenu: 'Pivot field filter',
        editFilter: 'Edit filter',
        searchValues: 'Search values',
        selectAll: 'Select all',
        blankValue: '(blank)',
        apply: 'Apply',
        cancel: 'Cancel',
        showAs: 'Show values as',
        dropFields: 'Drag fields here',
        noFields: 'No fields available',
        removeField: 'Remove field'
      },
      aggregates: {
        sum: 'Sum',
        count: 'Count',
        average: 'Average',
        weightedaverage: 'Weighted average',
        min: 'Minimum',
        max: 'Maximum'
      },
      showAs: {
        'no-calculation': 'No calculation',
        'percent-of-grand-total': '% of grand total',
        'percent-of-row-total': '% of row total',
        'percent-of-column-total': '% of column total',
        'difference-from-previous': 'Difference from previous',
        'percent-difference-from-previous': '% difference from previous',
        'running-total': 'Running total'
      },
      slicer: {
        ariaLabel: 'Pivot slicer',
        search: 'Search values',
        selectAll: 'Select all',
        apply: 'Apply',
        clear: 'Clear',
        noField: 'Select a field'
      }
    },
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
      invalidColor: 'Invalid color',
      comboboxLimitToList: 'Please select a valid item'
    },
    topLeftMenu: {
      ariaLabel: 'Grid menu',
      showSearchRow: 'Show search row',
      hideSearchRow: 'Hide search row',
      clearFilter: 'Clear filters',
      rowHeaders: 'Row headers',
      rowHeadersOff: 'Row headers: Off',
      rowHeadersNumbers: 'Row headers: Numbers',
      rowHeadersCellOnly: 'Row headers: Cells only',
      exportExcel: 'Export Excel',
      exportCsv: 'Export CSV',
      fullscreen: 'Grid fullscreen',
      exitFullscreen: 'Exit fullscreen'
    },
    aria: {
      cellEditor: 'Cell editor',
      openDatePicker: 'Open date picker',
      datePicker: 'Date picker',
      openComboBox: 'Open combo box',
      comboBoxOptions: 'Combo box options',
      openColorPicker: 'Open color picker',
      colorPicker: 'Color picker',
      openColumnChooser: 'Open column chooser',
      columnChooser: 'Column chooser',
      selectAllRows: 'Select all rows',
      selectRow: 'Select row {rowNumber}',
      rowDragItem: 'Grid row',
      expandNode: 'Expand node',
      collapseNode: 'Collapse node',
      year: 'Year'
    },
    filter: {
      openMenu: 'Open filter menu for {column}',
      searchValues: 'Search',
      selectAll: 'Select All',
      apply: 'Apply',
      cancel: 'Cancel',
      blankValue: '(Blanks)',
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
