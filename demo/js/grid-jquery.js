// jQuery Grid demo adapter.
(function (global, $) {
  "use strict";

  if (!$ || !$.fn || typeof $.fn.fabgrid !== "function") {
    throw new Error("FabGrid jQuery wrapper is not loaded.");
  }

  function createJQueryGridControl(host, options) {
    var $host = $(host);
    var eventBindings = [];
    var adapter;

    $host.attr("data-demo-adapter", "jquery");
    $host.fabgrid(options);

    function getInstance() {
      return $host.fabgrid("instance");
    }

    adapter = {
      on: function (name, handler) {
        var eventName = String(name || "").toLowerCase() + ".fabgrid";
        var jqueryHandler = function (event, args) {
          return handler(args || {});
        };
        $host.on(eventName, jqueryHandler);
        eventBindings.push({
          name: eventName,
          handler: jqueryHandler,
          source: handler,
        });
        return adapter;
      },
      off: function (name, handler) {
        var eventName = String(name || "").toLowerCase() + ".fabgrid";
        var index;
        for (index = eventBindings.length - 1; index >= 0; index -= 1) {
          if (eventBindings[index].name !== eventName) continue;
          if (handler && eventBindings[index].source !== handler) continue;
          $host.off(eventName, eventBindings[index].handler);
          eventBindings.splice(index, 1);
        }
        return adapter;
      },
      clearFilter: function () {
        return $host.fabgrid("clearFilter");
      },
      exportCsv: function (fileName, options) {
        return $host.fabgrid("exportCsv", fileName, options);
      },
      exportExcel: function (fileName, options) {
        return $host.fabgrid("exportExcel", fileName, options);
      },
      getCellData: function (rowIndex, columnIndex) {
        return $host.fabgrid("getCellData", rowIndex, columnIndex);
      },
      invalidate: function () {
        return $host.fabgrid("invalidate");
      },
      load: function () {
        return $host.fabgrid("load");
      },
      refresh: function () {
        return $host.fabgrid("refresh");
      },
      render: function () {
        return $host.fabgrid("render");
      },
      select: function (rowIndex, columnIndex) {
        return $host.fabgrid("select", rowIndex, columnIndex);
      },
      setColumns: function (columns) {
        return $host.fabgrid("setColumns", columns);
      },
      setEditMode: function (value) {
        return $host.fabgrid("setEditMode", value);
      },
      setFilter: function (predicate) {
        return $host.fabgrid("setFilter", predicate);
      },
      setFrozenColumns: function (value) {
        return $host.fabgrid("setFrozenColumns", value);
      },
      setFrozenRightColumns: function (value) {
        return $host.fabgrid("setFrozenRightColumns", value);
      },
      setItemsSource: function (rows, preserveRemoteTotal) {
        return $host.fabgrid("setItemsSource", rows, preserveRemoteTotal);
      },
      setLocale: function (locale) {
        return $host.fabgrid("setLocale", locale);
      },
      setMultiSelectRows: function (value) {
        return $host.fabgrid("setMultiSelectRows", value);
      },
      setRowGroups: function (groups) {
        return $host.fabgrid("setRowGroups", groups);
      },
      setSearch: function (value) {
        return $host.fabgrid("setSearch", value);
      },
      setShowRowHeaders: function (value) {
        return $host.fabgrid("setShowRowHeaders", value);
      },
      setFilterMode: function (value) {
        return $host.fabgrid("setFilterMode", value);
      },
    };

    Object.defineProperties(adapter, {
      columns: createInstanceProperty("columns"),
      columnRange: createInstanceProperty("columnRange"),
      control: createInstanceProperty(null),
      dataView: createInstanceProperty("dataView"),
      options: createInstanceProperty("options"),
      paginationTotal: createInstanceProperty("paginationTotal"),
      root: createInstanceProperty("root"),
      rowRange: createInstanceProperty("rowRange"),
      selection: createInstanceProperty("selection"),
      view: createInstanceProperty("view"),
    });

    return adapter;

    function createInstanceProperty(name) {
      return {
        configurable: false,
        enumerable: true,
        get: function () {
          return name ? $host.fabgrid("option", name) : getInstance();
        },
      };
    }
  }

  global.FabGridDemoCreateControl = createJQueryGridControl;
})(window, window.jQuery);
