import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  createFabGridJQuery,
  isPublicMethod,
  toJQueryEventName,
} from "../packages/fabgrid-jquery/src/fabgrid-jquery.js";

function createJQueryStub() {
  var dataStore = new WeakMap();
  var eventStore = new WeakMap();

  function Collection(elements) {
    var self = this;
    this.length = elements.length;
    elements.forEach(function (element, index) {
      self[index] = element;
    });
  }

  Collection.prototype.each = function (callback) {
    var i;
    for (i = 0; i < this.length; i += 1) callback.call(this[i], i, this[i]);
    return this;
  };

  Collection.prototype.on = function (name, handler) {
    return this.each(function () {
      var handlers = eventStore.get(this) || {};
      handlers[name] = handlers[name] || [];
      handlers[name].push(handler);
      eventStore.set(this, handlers);
    });
  };

  Collection.prototype.off = function (name, handler) {
    return this.each(function () {
      var handlers = eventStore.get(this) || {};
      handlers[name] = (handlers[name] || []).filter(function (item) {
        return item !== handler;
      });
      eventStore.set(this, handlers);
    });
  };

  Collection.prototype.attr = function (name, value) {
    return this.each(function () {
      this.attributes = this.attributes || {};
      this.attributes[name] = String(value);
    });
  };

  Collection.prototype.triggerHandler = function (event, args) {
    var element = this[0];
    var name = typeof event === "string" ? event : event.type;
    var handlers = element ? eventStore.get(element) || {} : {};
    (handlers[name] || []).forEach(function (handler) {
      if (
        handler.apply(element, [event].concat(args || [])) === false &&
        event.preventDefault
      )
        event.preventDefault();
    });
    return this;
  };

  function $(value) {
    if (value == null) return new Collection([]);
    return new Collection(Array.isArray(value) ? value : [value]);
  }

  $.fn = Collection.prototype;
  $.data = function (element, key, value) {
    var values = dataStore.get(element) || {};
    if (arguments.length === 3) {
      values[key] = value;
      dataStore.set(element, values);
    }
    return values[key];
  };
  $.removeData = function (element, key) {
    var values = dataStore.get(element) || {};
    delete values[key];
    dataStore.set(element, values);
  };
  $.Event = function (type) {
    var prevented = false;
    return {
      type: type,
      preventDefault: function () {
        prevented = true;
      },
      isDefaultPrevented: function () {
        return prevented;
      },
    };
  };
  return $;
}

function createCoreEvent() {
  var bindings = [];
  return {
    addHandler: function (handler, self) {
      bindings.push({ handler: handler, self: self });
    },
    removeHandler: function (handler, self) {
      bindings = bindings.filter(function (binding) {
        return binding.handler !== handler || binding.self !== self;
      });
    },
    raise: function (sender, args) {
      bindings.forEach(function (binding) {
        binding.handler.call(binding.self, sender, args);
      });
    },
    count: function () {
      return bindings.length;
    },
  };
}

function FakeGrid(element, options) {
  this.element = element;
  this.options = Object.assign({}, options);
  this.events = {};
  this.selectionChanged = createCoreEvent();
  this.disposed = false;
  this.invalidations = 0;
  this.setterCalls = [];
}

FakeGrid.prototype.on = function (name, handler) {
  this.events[name] = this.events[name] || [];
  this.events[name].push(handler);
};
FakeGrid.prototype.off = function (name, handler) {
  this.events[name] = (this.events[name] || []).filter(function (item) {
    return item !== handler;
  });
};
FakeGrid.prototype.emit = function (name, args) {
  (this.events[name] || []).slice().forEach(function (handler) {
    if (handler(args) === false) args.cancel = true;
  });
  return args.cancel !== true;
};
FakeGrid.prototype.refresh = function () {
  this.refreshed = true;
};
FakeGrid.prototype.getCellData = function () {
  return "cell-value";
};
FakeGrid.prototype.setItemsSource = function (value) {
  this.options.itemsSource = value;
};
FakeGrid.prototype.setColumns = function (value) {
  this.options.columns = value;
};
FakeGrid.prototype.setEditMode = function (value) {
  this.options.editMode = value;
  this.setterCalls.push(["setEditMode", value]);
};
FakeGrid.prototype.setHeaderDisplayMode = function (value) {
  this.options.headerDisplayMode = value;
  this.setterCalls.push(["setHeaderDisplayMode", value]);
};
FakeGrid.prototype.setMultiSelectRows = function (value) {
  this.options.multiSelectRows = value;
  this.setterCalls.push(["setMultiSelectRows", value]);
};
FakeGrid.prototype.setPage = function (value) {
  this.options.pageNumber = value;
  this.setterCalls.push(["setPage", value]);
};
FakeGrid.prototype.setPageSize = function (value) {
  this.options.pageSize = value;
  this.setterCalls.push(["setPageSize", value]);
};
FakeGrid.prototype.setRowGroups = function (value) {
  this.options.rowGroups = value;
  this.setterCalls.push(["setRowGroups", value]);
};
FakeGrid.prototype.setRowHeaderWidth = function (value) {
  this.options.rowHeaderWidth = value;
  this.setterCalls.push(["setRowHeaderWidth", value]);
};
FakeGrid.prototype.setFilterMode = function (value) {
  this.options.filterMode = value;
  this.setterCalls.push(["setFilterMode", value]);
};
FakeGrid.prototype.setAllowFiltering = function (value) {
  this.options.allowFiltering = value;
  this.setterCalls.push(["setAllowFiltering", value]);
};
FakeGrid.prototype.invalidate = function () {
  this.invalidations += 1;
};
FakeGrid.prototype.dispose = function () {
  this.disposed = true;
};
FakeGrid.prototype._privateMethod = function () {};

test("jQuery wrapper normalizes event names and protects private methods", function () {
  assert.equal(toJQueryEventName("selectionChanged"), "selectionchanged");
  assert.equal(isPublicMethod(new FakeGrid({}, {}), "refresh"), true);
  assert.equal(isPublicMethod(new FakeGrid({}, {}), "_privateMethod"), false);
});

test("jQuery wrapper initializes one core instance per element and remains chainable", function () {
  var $ = createJQueryStub();
  var elements = [{}, {}];
  createFabGridJQuery($, { FabGrid: FakeGrid });
  var collection = $(elements);
  var result = collection.fabgrid({ itemsSource: [{ id: 1 }] });
  assert.equal(result, collection);
  assert.notEqual(
    $(elements[0]).fabgrid("instance"),
    $(elements[1]).fabgrid("instance")
  );
});

test("jQuery wrapper updates options without creating another instance", function () {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({ itemsSource: [] });
  var instance = $(element).fabgrid("instance");
  $(element).fabgrid({ itemsSource: [{ id: 2 }], rowHeight: 36 });
  assert.equal($(element).fabgrid("instance"), instance);
  assert.deepEqual(instance.options.itemsSource, [{ id: 2 }]);
  assert.equal(instance.options.rowHeight, 36);
});

test("jQuery wrapper supports option getters, setters and method dispatch", function () {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({ rowHeight: 32 });
  assert.equal($(element).fabgrid("option", "rowHeight"), 32);
  assert.equal($(element).fabgrid("option", "rowHeight", 40)[0], element);
  assert.equal($(element).fabgrid("option", "rowHeight"), 40);
  assert.equal($(element).fabgrid("getCellData", 0, 0), "cell-value");
  assert.equal($(element).fabgrid("refresh")[0], element);
});

test("jQuery wrapper uses official core setters for dynamic options", function () {
  var $ = createJQueryStub();
  var element = {};
  var rowGroups = [{ binding: "category" }];
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({});
  $(element).fabgrid("option", {
    allowFiltering: false,
    editMode: true,
    headerDisplayMode: "binding",
    multiSelectRows: true,
    pageNumber: 3,
    pageSize: 50,
    rowHeaderWidth: 80,
    rowGroups: rowGroups,
    filterMode: ['searchRow', 'excel'],
  });
  assert.deepEqual($(element).fabgrid("instance").setterCalls, [
    ["setAllowFiltering", false],
    ["setEditMode", true],
    ["setHeaderDisplayMode", "binding"],
    ["setMultiSelectRows", true],
    ["setPage", 3],
    ["setPageSize", 50],
    ["setRowHeaderWidth", 80],
    ["setRowGroups", rowGroups],
    ["setFilterMode", ['searchRow', 'excel']],
  ]);
});

test("jQuery wrapper forwards cancellable events and callback options", function () {
  var $ = createJQueryStub();
  var element = {};
  var callbackCalls = 0;
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).on("selectionchanged.fabgrid", function (event, args) {
    args.fromJQuery = true;
    event.preventDefault();
  });
  $(element).fabgrid({
    selectionChanged: function (event, args) {
      callbackCalls += 1;
      assert.equal(args.fromJQuery, true);
    },
  });
  var args = {};
  $(element).fabgrid("instance").selectionChanged.raise(null, args);
  assert.equal(args.cancel, true);
  assert.equal(callbackCalls, 1);
});

test("jQuery wrapper forwards native emitter events without Wijmo event objects", function () {
  var $ = createJQueryStub();
  var element = {};
  var callbackCalls = 0;
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).on("viewportchanged.fabgrid", function (event, args) {
    args.fromJQuery = true;
    event.preventDefault();
  });
  $(element).fabgrid({
    viewportChanged: function (event, args) {
      callbackCalls += 1;
      assert.equal(args.fromJQuery, true);
    },
  });
  var args = {};
  assert.equal(
    $(element).fabgrid("instance").emit("viewportChanged", args),
    false
  );
  assert.equal(args.cancel, true);
  assert.equal(callbackCalls, 1);
});

test("jQuery wrapper forwards filter changed events", function () {
  var $ = createJQueryStub();
  var element = {};
  var callbackCalls = 0;
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).on("filterchanged.fabgrid", function (event, args) {
    assert.equal(args.cleared, true);
  });
  $(element).fabgrid({
    filterChanged: function (event, args) {
      callbackCalls += 1;
      assert.equal(args.source, "clearFilter");
    },
  });

  $(element)
    .fabgrid("instance")
    .emit("filterChanged", { source: "clearFilter", cleared: true });

  assert.equal(callbackCalls, 1);
});

test("jQuery wrapper updates and removes event callbacks on existing instances", function () {
  var $ = createJQueryStub();
  var element = {};
  var firstCalls = 0;
  var secondCalls = 0;
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({
    selectionChanged: function () {
      firstCalls += 1;
    },
  });
  $(element).fabgrid({
    selectionChanged: function () {
      secondCalls += 1;
    },
  });
  $(element).fabgrid("instance").selectionChanged.raise(null, {});
  assert.equal(firstCalls, 0);
  assert.equal(secondCalls, 1);
  $(element).fabgrid("option", { selectionChanged: null });
  $(element).fabgrid("instance").selectionChanged.raise(null, {});
  assert.equal(firstCalls, 0);
  assert.equal(secondCalls, 1);
});

test("jQuery wrapper destroy removes its bindings, disposes and allows reinitialization", function () {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({});
  var first = $(element).fabgrid("instance");
  assert.equal(first.selectionChanged.count(), 1);
  assert.equal(first.events.viewportChanged.length, 1);
  $(element).fabgrid("destroy");
  assert.equal(first.disposed, true);
  assert.equal(first.selectionChanged.count(), 0);
  assert.equal(first.events.viewportChanged.length, 0);
  assert.equal($(element).fabgrid("instance"), undefined);
  $(element).fabgrid({});
  assert.notEqual($(element).fabgrid("instance"), first);
});

test("jQuery wrapper rejects calls before initialization and private methods", function () {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  assert.throws(function () {
    $(element).fabgrid("refresh");
  }, /before initialization/);
  $(element).fabgrid({});
  assert.throws(function () {
    $(element).fabgrid("_privateMethod");
  }, /Unknown or private/);
});

test("jQuery wrapper registers thin Pivot component plugins", function () {
  var $ = createJQueryStub();
  var element = {};

  function FakeGrid() {}
  function FakePivotEngine() {}
  function FakePivotControl(host, options) {
    this.host = host;
    this.options = options || {};
    this.disposeCalls = 0;
  }
  FakePivotControl.prototype.refresh = function () {
    return 'refreshed';
  };
  FakePivotControl.prototype.dispose = function () {
    this.disposeCalls += 1;
  };

  var plugin = createFabGridJQuery($, {
    FabGrid: FakeGrid,
    pivot: {
      PivotEngine: FakePivotEngine,
      PivotPanel: FakePivotControl,
      PivotGrid: FakePivotControl,
      PivotChart: FakePivotControl,
      PivotWorkspace: FakePivotControl,
      PivotSlicer: FakePivotControl
    }
  });

  assert.equal(typeof $.fn.fabpivotpanel, "function");
  assert.equal(typeof $.fn.fabpivotgrid, "function");
  assert.equal(typeof $.fn.fabpivotchart, "function");
  assert.equal(typeof $.fn.fabpivotworkspace, "function");
  assert.equal(typeof $.fn.fabpivotslicer, "function");
  $(element).fabpivotworkspace({ layout: "Auto" });
  assert.equal($(element).fabpivotworkspace("instance").options.layout, "Auto");
  assert.equal($(element).fabpivotworkspace("refresh"), "refreshed");
  assert.equal(plugin.pivot.workspace.getInstance(element).host, element);
  $(element).fabpivotworkspace("destroy");
  assert.equal(plugin.pivot.workspace.getInstance(element), undefined);
});

test("jQuery demo adapter routes initialization, methods and events through the wrapper", function () {
  var $ = createJQueryStub();
  var element = {};
  var commands = [];
  var eventArgs = null;
  createFabGridJQuery($, { FabGrid: FakeGrid });
  var plugin = $.fn.fabgrid;
  $.fn.fabgrid = function (command) {
    commands.push(command);
    return plugin.apply(this, arguments);
  };
  var context = { window: { jQuery: $ } };
  runInNewContext(
    readFileSync(new URL("../demo/js/grid-jquery.js", import.meta.url), "utf8"),
    context
  );
  var adapter = context.window.FabGridDemoCreateControl(element, {
    itemsSource: [],
  });
  adapter.on("selectionChanged", function (args) {
    eventArgs = args;
  });
  adapter.refresh();
  assert.equal(adapter.getCellData(0, 0), "cell-value");
  adapter.control.selectionChanged.raise(null, { row: 2, col: 3 });
  assert.deepEqual(eventArgs, { row: 2, col: 3 });
  assert.equal(adapter.control.refreshed, true);
  assert.equal(element.attributes["data-demo-adapter"], "jquery");
  assert.equal(typeof commands[0], "object");
  assert.equal(commands.includes("refresh"), true);
  assert.equal(commands.includes("getCellData"), true);
  assert.equal(commands.includes("instance"), true);
});
