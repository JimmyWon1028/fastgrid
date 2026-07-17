import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFabEditBoxJQuery,
  isFabEditBoxPublicMethod,
  parseFabEditBoxDataOptions,
  toFabEditBoxJQueryEventName
} from '../packages/fabeditbox-jquery/src/fabeditbox-jquery.js';

function createJQueryStub() {
  var dataStore = new WeakMap();
  var eventStore = new WeakMap();

  function Collection(elements) {
    var self = this;
    this.length = elements.length;
    elements.forEach(function(element, index) {
      self[index] = element;
    });
  }

  Collection.prototype.each = function(callback) {
    var index;
    for (index = 0; index < this.length; index += 1) {
      callback.call(this[index], index, this[index]);
    }
    return this;
  };

  Collection.prototype.on = function(name, handler) {
    return this.each(function() {
      var handlers = eventStore.get(this) || {};
      handlers[name] = handlers[name] || [];
      handlers[name].push(handler);
      eventStore.set(this, handlers);
    });
  };

  Collection.prototype.triggerHandler = function(event, args) {
    var element = this[0];
    var name = typeof event === 'string' ? event : event.type;
    var handlers = element ? eventStore.get(element) || {} : {};
    (handlers[name] || []).forEach(function(handler) {
      handler.apply(element, [event].concat(args || []));
    });
    return this;
  };

  function $(value) {
    if (value == null) return new Collection([]);
    return new Collection(Array.isArray(value) ? value : [value]);
  }

  $.fn = Collection.prototype;
  $.data = function(element, key, value) {
    var values = dataStore.get(element) || {};
    if (arguments.length === 3) {
      values[key] = value;
      dataStore.set(element, values);
    }
    return values[key];
  };
  $.removeData = function(element, key) {
    var values = dataStore.get(element) || {};
    delete values[key];
    dataStore.set(element, values);
  };
  return $;
}

function FakeEditBox(element, options) {
  this.element = element;
  this._options = Object.assign({}, options);
  delete this._options.editor;
  this._value = options && options.value != null ? options.value : '';
  this._listeners = {};
  this.disposed = false;
}

FakeEditBox.prototype.options = function() {
  return this._options;
};
FakeEditBox.prototype.getValue = function() {
  return this._value;
};
FakeEditBox.prototype.setValue = function(value) {
  this._value = value;
  this._options.value = value;
  return this;
};
FakeEditBox.prototype.clear = function() {
  return this.setValue('');
};
FakeEditBox.prototype.on = function(name, handler) {
  this._listeners[name] = this._listeners[name] || [];
  this._listeners[name].push(handler);
  return this;
};
FakeEditBox.prototype.off = function(name, handler) {
  this._listeners[name] = (this._listeners[name] || []).filter(function(item) {
    return item !== handler;
  });
  return this;
};
FakeEditBox.prototype.emit = function(name, detail) {
  (this._listeners[name] || []).slice().forEach(function(handler) {
    handler(detail);
  });
};
FakeEditBox.prototype.dispose = function() {
  this.disposed = true;
  this._listeners = {};
};
FakeEditBox.prototype._privateMethod = function() {};

test('FabEditBox jQuery helpers normalize events and reject private methods', function() {
  var instance = new FakeEditBox({}, {});
  assert.equal(toFabEditBoxJQueryEventName('showPanel'), 'showpanel');
  assert.equal(isFabEditBoxPublicMethod(instance, 'setValue'), true);
  assert.equal(isFabEditBoxPublicMethod(instance, '_privateMethod'), false);
});

test('FabEditBox jQuery safely parses EasyUI-style data-options', function() {
  assert.deepEqual(
    parseFabEditBoxDataOptions(
      "editor:'text',iconCls:'icon-search',width:300,clearButton:true"
    ),
    {
      editor: 'text',
      iconCls: 'icon-search',
      width: 300,
      clearButton: true
    }
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      parseFabEditBoxDataOptions("__proto__:{polluted:true}"),
      '__proto__'
    ),
    false
  );
});

test('FabEditBox jQuery parses declarative elements and inline dimensions', function() {
  var $ = createJQueryStub();
  var element = {
    className: 'fab-editbox',
    style: { width: '300px' },
    getAttribute: function(name) {
      return name === 'data-options' ?
        "editor:'text',iconCls:'icon-search'" :
        null;
    }
  };
  var context = {
    querySelectorAll: function() {
      return [element];
    }
  };
  var adapter = createFabEditBoxJQuery($, { EditBox: FakeEditBox });
  adapter.parse(context);
  assert.equal($(element).fabeditbox('option', 'editor'), 'text');
  assert.equal($(element).fabeditbox('option', 'iconCls'), 'icon-search');
  assert.equal($(element).fabeditbox('option', 'width'), '300px');
  assert.deepEqual($(element).fabeditbox('option', 'icons'), [{
    iconCls: 'icon-search',
    align: 'right',
    width: undefined
  }]);
});

test('FabEditBox jQuery initializes each element and keeps setters chainable', function() {
  var $ = createJQueryStub();
  var elements = [{}, {}];
  var collection = $(elements);
  createFabEditBoxJQuery($, { EditBox: FakeEditBox });
  assert.equal(collection.fabeditbox({ editor: 'number' }), collection);
  assert.notEqual(
    $(elements[0]).fabeditbox('instance'),
    $(elements[1]).fabeditbox('instance')
  );
  assert.equal($(elements[0]).fabeditbox('setValue', 1280.5)[0], elements[0]);
  assert.equal($(elements[0]).fabeditbox('getValue'), 1280.5);
});

test('FabEditBox jQuery option updates rebuild the control with merged options', function() {
  var $ = createJQueryStub();
  var element = {};
  createFabEditBoxJQuery($, { EditBox: FakeEditBox });
  $(element).fabeditbox({ editor: 'text', width: 200, value: 'A' });
  var first = $(element).fabeditbox('instance');
  $(element).fabeditbox('option', 'width', 280);
  var second = $(element).fabeditbox('instance');
  assert.notEqual(second, first);
  assert.equal(first.disposed, true);
  assert.equal($(element).fabeditbox('option', 'editor'), 'text');
  assert.equal($(element).fabeditbox('option', 'width'), 280);
  assert.equal($(element).fabeditbox('getValue'), 'A');
});

test('FabEditBox jQuery forwards core and lifecycle events', function() {
  var $ = createJQueryStub();
  var element = {};
  var changes = 0;
  var initialized = 0;
  var destroyed = 0;
  createFabEditBoxJQuery($, { EditBox: FakeEditBox });
  $(element)
    .on('initialized.fabeditbox', function(event, instance) {
      if (instance) initialized += 1;
    })
    .on('change.fabeditbox', function(event, detail, instance) {
      if (detail.value === 'B' && instance) changes += 1;
    })
    .on('destroyed.fabeditbox', function(event, instance) {
      if (instance) destroyed += 1;
    });
  $(element).fabeditbox({ editor: 'text' });
  $(element).fabeditbox('instance').emit('change', { value: 'B' });
  $(element).fabeditbox('destroy');
  assert.equal(initialized, 1);
  assert.equal(changes, 1);
  assert.equal(destroyed, 1);
  assert.equal($(element).fabeditbox('instance'), undefined);
});

test('FabEditBox jQuery rejects commands before initialization', function() {
  var $ = createJQueryStub();
  var element = {};
  createFabEditBoxJQuery($, { EditBox: FakeEditBox });
  assert.throws(function() {
    $(element).fabeditbox('getValue');
  }, /before initialization/);
});
