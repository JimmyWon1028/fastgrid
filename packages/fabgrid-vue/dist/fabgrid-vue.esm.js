var GRID_EVENTS = [
  'selectionChanged',
  'beginningEdit',
  'cellEditEnding',
  'cellEditEnded',
  'sortedColumn',
  'beforeLoad',
  'loadSuccess',
  'loadError',
  'itemsSourceChanged',
  'loadedRows',
  'filterChanged',
  'draggedRow',
  'draggingRow',
  'rowHeaderModeChanged',
  'searchRowVisibilityChanged'
];

var OPTION_PROPS = [
  'allowEditing',
  'allowDragging',
  'allowSorting',
  'allowResizing',
  'activeCellBorder',
  'frozenColumns',
  'frozenRightColumns',
  'isReadOnly',
  'locale',
  'pagination',
  'pager',
  'remote',
  'url',
  'method',
  'loader'
];

var COLUMN_PROPS = [
  'binding',
  'header',
  'width',
  'minWidth',
  'align',
  'dataType',
  'format',
  'isReadOnly',
  'visible',
  'editor',
  'formatter'
];

export function toKebabCase(value) {
  return String(value || '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function normalizeColumnProps(source) {
  var result = {};
  COLUMN_PROPS.forEach(function(name) {
    if (source[name] !== undefined) result[name] = source[name];
  });
  return result;
}

export function createGridOptions(vm) {
  var options = {};
  var columns = vm.columns && vm.columns.length ? vm.columns : vm.getDeclaredColumns();
  Object.keys(vm.gridOptions || {}).forEach(function(name) {
    options[name] = vm.gridOptions[name];
  });
  OPTION_PROPS.forEach(function(name) {
    if (vm[name] !== undefined) options[name] = vm[name];
  });
  options.itemsSource = vm.itemsSource || [];
  if (columns.length) options.columns = columns;
  return options;
}

export function createFabGridVue(Vue, fabui) {
  if (!Vue) throw new Error('fabgrid-vue requires Vue 2.');
  if (!fabui || typeof fabui.FabGrid !== 'function') throw new Error('fabgrid-vue requires fabui.FabGrid.');

  var FabGridColumn = {
    name: 'FabGridColumn',
    inject: ['fabGridContext'],
    props: {
      binding: String,
      header: String,
      width: [Number, String],
      minWidth: Number,
      align: String,
      dataType: String,
      format: [String, Function],
      isReadOnly: Boolean,
      visible: { type: Boolean, default: true },
      editor: [String, Object],
      formatter: Function
    },
    created: function() {
      this.fabGridContext.registerColumn(this);
    },
    beforeDestroy: function() {
      this.fabGridContext.unregisterColumn(this);
    },
    render: function() {
      return null;
    }
  };

  var FabGrid = {
    name: 'FabGrid',
    components: { FabGridColumn: FabGridColumn },
    props: {
      itemsSource: { type: Array, default: function() { return []; } },
      columns: { type: Array, default: null },
      gridOptions: { type: Object, default: function() { return {}; } },
      allowEditing: { type: Boolean, default: undefined },
      allowDragging: { type: [Boolean, String], default: undefined },
      allowSorting: { type: Boolean, default: undefined },
      allowResizing: { type: Boolean, default: undefined },
      activeCellBorder: { type: Number, default: undefined },
      frozenColumns: { type: Number, default: undefined },
      frozenRightColumns: { type: Number, default: undefined },
      isReadOnly: { type: Boolean, default: undefined },
      locale: { type: String, default: undefined },
      pagination: { type: [Boolean, Object], default: undefined },
      pager: { type: Object, default: undefined },
      remote: { type: Boolean, default: undefined },
      url: { type: String, default: undefined },
      method: { type: String, default: undefined },
      loader: { type: Function, default: undefined }
    },
    beforeCreate: function() {
      this.control = null;
      this._declaredColumns = [];
      this._eventBindings = [];
    },
    provide: function() {
      var self = this;
      return {
        fabGridContext: {
          registerColumn: function(column) { self.registerColumn(column); },
          unregisterColumn: function(column) { self.unregisterColumn(column); }
        }
      };
    },
    mounted: function() {
      this.createControl();
    },
    beforeDestroy: function() {
      this.destroyControl();
    },
    watch: {
      itemsSource: function(value) {
        if (this.control) this.control.setItemsSource(value || []);
      },
      columns: function() {
        this.syncColumns();
      },
      gridOptions: {
        handler: function(value) {
          this.applyGridOptions(value || {});
        },
        deep: false
      },
      allowEditing: function(value) { this.applyOption('allowEditing', value); },
      allowDragging: function(value) { this.applyOption('allowDragging', value); },
      allowSorting: function(value) { this.applyOption('allowSorting', value); },
      allowResizing: function(value) { this.applyOption('allowResizing', value); },
      activeCellBorder: function(value) {
        if (!this.control || value === undefined) return;
        this.control.activeCellBorder = value;
      },
      frozenColumns: function(value) {
        if (!this.control || value === undefined) return;
        if (typeof this.control.setFrozenColumns === 'function') this.control.setFrozenColumns(value);
        else this.applyOption('frozenColumns', value);
      },
      frozenRightColumns: function(value) { this.applyOption('frozenRightColumns', value); },
      isReadOnly: function(value) { this.applyOption('isReadOnly', value); },
      locale: function(value) {
        if (!this.control || value === undefined) return;
        if (typeof this.control.setLocale === 'function') this.control.setLocale(value);
        else this.applyOption('locale', value);
      },
      pagination: function(value) { this.applyOption('pagination', value); },
      pager: function(value) { this.applyOption('pager', value); },
      remote: function(value) { this.applyOption('remote', value); },
      url: function(value) { this.applyOption('url', value); },
      method: function(value) { this.applyOption('method', value); },
      loader: function(value) { this.applyOption('loader', value); }
    },
    methods: {
      createControl: function() {
        if (this.control || !this.$refs.host) return;
        this.control = new fabui.FabGrid(this.$refs.host, createGridOptions(this));
        this.bindGridEvents();
        this.$emit('initialized', this.control);
      },
      destroyControl: function() {
        var self = this;
        this._eventBindings.forEach(function(binding) {
          if (binding.event && typeof binding.event.removeHandler === 'function') binding.event.removeHandler(binding.handler, self);
        });
        this._eventBindings = [];
        if (this.control && typeof this.control.dispose === 'function') this.control.dispose();
        this.control = null;
      },
      bindGridEvents: function() {
        var self = this;
        GRID_EVENTS.forEach(function(name) {
          var event = self.control && self.control[name];
          var handler;
          if (!event || typeof event.addHandler !== 'function') return;
          handler = function(sender, args) {
            self.$emit(toKebabCase(name), args || {});
          };
          event.addHandler(handler, self);
          self._eventBindings.push({ event: event, handler: handler });
        });
      },
      registerColumn: function(column) {
        if (this._declaredColumns.indexOf(column) < 0) this._declaredColumns.push(column);
        if (this.control && !this.columns) this.syncColumns();
      },
      unregisterColumn: function(column) {
        var index = this._declaredColumns.indexOf(column);
        if (index >= 0) this._declaredColumns.splice(index, 1);
        if (this.control && !this.columns) this.syncColumns();
      },
      getDeclaredColumns: function() {
        return this._declaredColumns.map(function(column) {
          return normalizeColumnProps(column);
        });
      },
      syncColumns: function() {
        var columns;
        if (!this.control) return;
        columns = this.columns && this.columns.length ? this.columns : this.getDeclaredColumns();
        this.control.setColumns(columns);
      },
      applyOption: function(name, value) {
        if (!this.control || value === undefined) return;
        this.control.options[name] = value;
        if (typeof this.control.invalidate === 'function') this.control.invalidate();
      },
      applyGridOptions: function(options) {
        var self = this;
        if (!this.control) return;
        Object.keys(options).forEach(function(name) {
          self.control.options[name] = options[name];
        });
        this.control.invalidate();
      },
      refresh: function() {
        if (this.control) this.control.refresh();
      },
      invalidate: function() {
        if (this.control) this.control.invalidate();
      },
      select: function(row, col) {
        if (this.control) this.control.select(row, col);
      },
      scrollIntoView: function(row, col) {
        if (this.control) this.control.scrollIntoView(row, col);
      }
    },
    render: function(h) {
      return h('div', { staticClass: 'fui-vue-fabgrid', staticStyle: { width: '100%', height: '100%' } }, [
        h('div', { ref: 'host', staticClass: 'fui-vue-fabgrid-host', staticStyle: { width: '100%', height: '100%' } }),
        h('div', { staticStyle: { display: 'none' } }, this.$slots.default)
      ]);
    }
  };

  return {
    FabGrid: FabGrid,
    FabGridColumn: FabGridColumn,
    install: function(targetVue) {
      targetVue.component('FabGrid', FabGrid);
      targetVue.component('FabGridColumn', FabGridColumn);
    }
  };
}

export default createFabGridVue;
