// Shared Grid demo query helpers.
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

    switch (String(rule.op || '').toLowerCase()) {
      case '%..%':
      case 'contains':
        return actual.indexOf(expected) >= 0;
      case '%..':
      case 'ends':
        return actual.lastIndexOf(expected) === actual.length - expected.length;
      case '!..%':
      case 'not-starts':
        return actual.indexOf(expected) !== 0;
      case '!%..%':
      case 'not-contains':
        return actual.indexOf(expected) < 0;
      case '!%..':
      case 'not-ends':
        return actual.lastIndexOf(expected) !== actual.length - expected.length;
      case '>=':
      case 'gte':
        return comparableActual >= comparableExpected;
      case '>':
      case 'gt':
        return comparableActual > comparableExpected;
      case '<=':
      case 'lte':
        return comparableActual <= comparableExpected;
      case '<':
      case 'lt':
        return comparableActual < comparableExpected;
      case '<>':
      case 'ne':
        return comparableActual !== comparableExpected;
      case '=':
      case 'eq':
        return comparableActual === comparableExpected;
      case 'in':
        return expected.split(',').map(function(item) {
          return item.trim();
        }).indexOf(actual) >= 0;
      case '..%':
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
