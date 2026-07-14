(function(global) {
  'use strict';

  function filterRemoteRows(sourceRows, searchText, filterRules) {
    var filteredRows = sourceRows;
    if (searchText) {
      filteredRows = filteredRows.filter(function(row) {
        return Object.keys(row).some(function(field) {
          return (
            row[field] != null &&
            String(row[field]).toLowerCase().indexOf(String(searchText).toLowerCase()) >= 0
          );
        });
      });
    }
    if (filterRules.length) {
      filteredRows = filteredRows.filter(function(row) {
        return filterRules.every(function(rule) {
          return matchesRemoteFilterRule(row, rule);
        });
      });
    }
    return filteredRows;
  }

  function matchesRemoteFilterRule(row, rule) {
    var rawActual = row[rule.field];
    var actual = rawActual == null ? '' : String(rawActual).toLowerCase();
    var expected = String(rule.value).toLowerCase();
    var comparableActual = typeof rawActual === 'number' ? rawActual : actual;
    var comparableExpected = typeof rawActual === 'number' ? Number(rule.value) : expected;

    switch (rule.op) {
      case 'contains':
        return actual.indexOf(expected) >= 0;
      case 'ends':
        return actual.lastIndexOf(expected) === actual.length - expected.length;
      case 'not-starts':
        return actual.indexOf(expected) !== 0;
      case 'not-contains':
        return actual.indexOf(expected) < 0;
      case 'not-ends':
        return actual.lastIndexOf(expected) !== actual.length - expected.length;
      case 'gte':
        return comparableActual >= comparableExpected;
      case 'gt':
        return comparableActual > comparableExpected;
      case 'lte':
        return comparableActual <= comparableExpected;
      case 'lt':
        return comparableActual < comparableExpected;
      case 'ne':
        return comparableActual !== comparableExpected;
      case 'eq':
        return comparableActual === comparableExpected;
      default:
        return actual.indexOf(expected) === 0;
    }
  }

  function sortRemoteRows(rows, sortFields, sortOrders) {
    if (!sortFields.length) {
      return rows;
    }
    rows.sort(function(left, right) {
      var index;
      var field;
      var result;
      for (index = 0; index < sortFields.length; index += 1) {
        field = sortFields[index];
        result = left[field] === right[field] ? 0 : left[field] > right[field] ? 1 : -1;
        if (result) {
          return sortOrders[index] === 'desc' ? -result : result;
        }
      }
      return 0;
    });
    return rows;
  }

  global.FabGridDemoQuery = {
    filterRemoteRows: filterRemoteRows,
    matchesRemoteFilterRule: matchesRemoteFilterRule,
    sortRemoteRows: sortRemoteRows
  };
}(window));
