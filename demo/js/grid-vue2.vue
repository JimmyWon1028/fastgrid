<template>
  <main class="page">
    <section
      ref="toolbar"
      data-fabgrid-demo-toolbar
      @change="handleToolbarChange"
      @click="handleToolbarClick"
      @input="handleToolbarInput"
    ></section>

    <section class="stats" aria-label="FabGrid stats">
      <span> {{ text.rows }}: {{ stats.totalRows }} / {{ rows.length }} </span>
      <span>
        {{ text.rowsVisible }}: {{ stats.rowStart }}-{{
          Math.max(stats.rowStart, stats.rowEnd - 1)
        }}
      </span>
      <span>
        {{ text.columnsVisible }}: {{ stats.columnStart }}-{{
          Math.max(stats.columnStart, stats.columnEnd - 1)
        }}
        / {{ columns.length }}
      </span>
      <span>{{ text.renderedCells }}: {{ stats.renderedCells }}</span>
    </section>

    <section ref="gridShell" class="grid-shell">
      <fab-grid
        ref="grid"
        :items-source="rows"
        :columns="columns"
        :grid-options="gridOptions"
        :allow-editing="editMode"
        :frozen-columns="frozenColumns"
        :frozen-right-columns="frozenRightColumns"
        :locale="locale"
        :pagination="pagination"
        :remote="remote"
        :loader="remoteLoader"
        @initialized="handleInitialized"
        @load-success="updateStats"
      ></fab-grid>
      <div class="demo-filter-bar" aria-label="Demo filter">
        <span class="demo-result-count">
          {{ text.resultCount }}: {{ formatNumber(stats.totalRows) }}
        </span>
        <label class="demo-filter-control">
          <span>{{ text.filter }}</span>
          <span class="demo-filter-input-wrap">
            <input
              ref="demoFilter"
              v-model="filterText"
              type="search"
              :disabled="remote"
              :placeholder="text.filterPlaceholder"
              autocomplete="off"
            />
            <button
              class="demo-filter-mode"
              :class="{ 'demo-filter-mode-and': quickFilterMode === 'and' }"
              type="button"
              :disabled="remote"
              :aria-label="filterModeLabel"
              :title="filterModeLabel"
              @click="toggleFilterMode"
            >
              {{ filterModeLabel }}
            </button>
            <button
              type="button"
              :disabled="remote"
              :aria-label="text.clearFilter"
              :title="text.clearFilter"
              @click="clearFilter"
            >
              🧹
            </button>
          </span>
        </label>
      </div>
    </section>

    <div
      class="lookup-popup-overlay"
      :style="{ display: lookupVisible ? 'flex' : 'none' }"
      @mousedown.self="closeLookupPopup"
    >
      <div
        class="lookup-popup-window"
        role="dialog"
        aria-modal="true"
        :aria-label="text.popupGridTitle"
      >
        <div class="lookup-popup-header">
          <strong class="lookup-popup-title">{{ text.popupGridTitle }}</strong>
          <div class="lookup-popup-controls">
            <button
              class="lookup-popup-icon-button icon-close"
              type="button"
              :aria-label="text.close"
              :title="text.close"
              @click="closeLookupPopup"
            ></button>
          </div>
        </div>
        <div class="lookup-popup-grid" @click.capture="handleLookupClick">
          <fab-grid
            ref="lookupGrid"
            :items-source="lookupRows"
            :columns="lookupColumns"
            :grid-options="lookupGridOptions"
            :locale="locale"
            @initialized="handleLookupInitialized"
          ></fab-grid>
        </div>
        <div class="lookup-popup-pager">
          <span>|‹</span>
          <span>‹</span>
          <strong>{{ text.lookupPage }}</strong>
          <span>›</span>
          <span>›|</span>
          <span>↻</span>
          <span class="lookup-popup-count">{{ lookupRangeText }}</span>
        </div>
        <div class="lookup-popup-footer">
          <button
            class="lookup-popup-button icon-clear"
            type="button"
            @click="clearLookupSelection"
          >
            {{ text.clearFilter }}
          </button>
          <button
            class="lookup-popup-button icon-remove"
            type="button"
            @click="closeLookupPopup"
          >
            {{ text.cancel }}
          </button>
          <button
            class="lookup-popup-button icon-check"
            type="button"
            @click="applyLookupValue"
          >
            {{ text.confirm }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import "./grid-toolbar.js?v=20260722-filter-mode-v1";
import "./grid-data.js?v=20260715-remove-currency-v1";
import "./grid-locales.js?v=20260715-remove-currency-v1";
import "./grid-query.js?v=20260722-remote-op-symbol-v1";

var DEMO_QUERY = window.FabGridDemoQuery;
var SETTINGS_KEY =
  window.FABGRID_DEMO_SETTINGS_KEY ||
  "fabgrid.demo.settings.v4.default-toolbar-state";
var STATUS_STYLES = {
  draft: { cssClass: "status-draft", color: "#6b7280" },
  pending: { cssClass: "status-pending", color: "#b45309" },
  approved: { cssClass: "status-approved", color: "#047857" },
  closed: { cssClass: "status-closed", color: "#1d4ed8" },
};
var DEMO_LOCALES = window.FabGridDemoLocales;

const app = new Vue({
  data: function () {
    return {
      rows: window.FabGridDemoData.rows,
      columns: [],
      locale: "zh-TW",
      theme: "default",
      frozenColumns: 2,
      frozenRightColumns: 1,
      showRowHeaders: true,
      columnFilterMode: ['excel', 'searchRow'],
      pagination: false,
      remote: false,
      multiSelectRows: false,
      editMode: false,
      rowGroupMode: "none",
      filterText: "",
      quickFilterMode: "or",
      exportBusy: false,
      fullscreenAvailable: false,
      fullscreenActive: false,
      grid: null,
      viewportHandler: null,
      excelExportingHandler: null,
      excelExportedHandler: null,
      excelExportFailedHandler: null,
      searchClearedHandler: null,
      lookupVisible: false,
      lookupEditorArgs: null,
      lookupGrid: null,
      lookupLastClick: null,
      lookupRows: window.FabGridDemoData.lookupRows,
      lookupColumns: [],
      lookupGridOptions: {
        rowHeight: 32,
        headerHeight: 32,
        overscanRows: 4,
        overscanColumns: 1,
        showRowHeaders: true,
        rowHeaderWidth: 42,
        allowSorting: true,
        allowResizing: true,
        allowEditing: false,
        editOnSelect: false,
        alternatingRowStep: 1,
        formatCell: formatLookupCell,
      },
      stats: {
        totalRows: window.FabGridDemoData.rowCount,
        rowStart: 0,
        rowEnd: 0,
        columnStart: 0,
        columnEnd: 0,
        renderedCells: 0,
      },
      themes: [
        { value: "default", label: "Default" },
        { value: "bootstrap", label: "Bootstrap" },
        { value: "cupertino", label: "Cupertino" },
        { value: "material", label: "Material" },
        { value: "material-blue", label: "Material Blue" },
        { value: "material-teal", label: "Material Teal" },
        { value: "metro", label: "Metro" },
        { value: "metro-blue", label: "Metro Blue" },
        { value: "metro-gray", label: "Metro Gray" },
        { value: "metro-green", label: "Metro Green" },
        { value: "metro-orange", label: "Metro Orange" },
        { value: "metro-red", label: "Metro Red" },
        { value: "sunny", label: "Sunny" },
        { value: "pepper-grinder", label: "Pepper Grinder" },
        { value: "dark-hive", label: "Dark Hive" },
        { value: "black", label: "Black" },
      ],
      gridOptions: {
        rowHeight: 32,
        headerHeight: 32,
        activeCellBorder: 2,
        searchDelay: 400,
        overscanRows: 14,
        overscanColumns: 3,
        showFooter: true,
        footerHeight: 32,
        showRowHeaders: true,
        rowHeaderWidth: 50,
        filterMode: ['excel', 'searchRow'],
        multiSelectRows: false,
        allowSorting: true,
        allowDragging: "Columns",
        allowEditing: false,
        editOnSelect: false,
        allowResizing: true,
        alternatingRowStep: 1,
        observeItemsSource: true,
        headerToggleKey: "f4",
        formatCell: formatDemoCell,
        pager: {
          pageNumber: 1,
          pageSize: 100,
          pageList: [10, 20, 30, 40, 50, 100, 500],
          showPageList: false,
          showPageInfo: true,
          showRefresh: true,
        },
      },
    };
  },
  created: function () {
    this.restoreSettings();
    this.gridOptions.showRowHeaders = this.showRowHeaders;
    this.gridOptions.filterMode = this.columnFilterMode;
    this.gridOptions.multiSelectRows = this.multiSelectRows;
    this.gridOptions.allowEditing = this.editMode;
    this.gridOptions.editOnSelect = this.editMode;
    this.columns = createColumns(
      window.FabGridDemoData.columnCount,
      this.openLookupPopup,
      this.locale
    );
    this.gridOptions.rowGroups = createRowGroups(
      this.rowGroupMode,
      this.locale,
      this.columns
    );
    this.lookupColumns = createLookupColumns(this.locale);
  },
  mounted: function () {
    window.FabGridDemoToolbar.render(this.$refs.toolbar);
    document.addEventListener("keydown", this.handleDocumentKeydown);
    document.addEventListener(
      "fullscreenchange",
      this.handleGridFullscreenChange
    );
    if (!("onfullscreenchange" in document)) {
      document.addEventListener(
        "webkitfullscreenchange",
        this.handleGridFullscreenChange
      );
    }
    this.updateFullscreenState();
    this.syncToolbar();
  },
  computed: {
    text: function () {
      return DEMO_LOCALES[this.locale] || DEMO_LOCALES["zh-TW"];
    },
    filterModeLabel: function () {
      return this.quickFilterMode === "and" ? "&" : "OR";
    },
    lookupRangeText: function () {
      return formatText(this.text.lookupRange, {
        count: this.lookupRows.length,
      });
    },
    remoteLoader: function () {
      return this.loadRemoteRows;
    },
    toolbarState: function () {
      return {
        locale: this.locale,
        theme: this.theme,
        frozenColumns: this.frozenColumns,
        frozenRightColumns: this.frozenRightColumns,
        showRowHeaders: this.showRowHeaders,
        filterMode: this.columnFilterMode,
        pagination: this.pagination,
        remote: this.remote,
        rowGroupMode: this.rowGroupMode,
        multiSelectRows: this.multiSelectRows,
        editMode: this.editMode,
        exportBusy: this.exportBusy,
        fullscreenAvailable: this.fullscreenAvailable,
        fullscreenActive: this.fullscreenActive,
        datasetSummary: this.rows.length + " x " + this.columns.length,
      };
    },
  },
  watch: {
    toolbarState: function () {
      this.$nextTick(this.syncToolbar);
    },
    theme: function () {
      this.applyTheme();
      this.saveSettings();
    },
    locale: function (value) {
      document.documentElement.lang = value;
      this.columns = createColumns(
        window.FabGridDemoData.columnCount,
        this.openLookupPopup,
        value
      );
      this.lookupColumns = createLookupColumns(value);
      if (window.fabGridDemo) window.fabGridDemo.columns = this.columns;
      this.$nextTick(this.applyRowGroups);
      this.saveSettings();
    },
    frozenColumns: "saveSettings",
    frozenRightColumns: "saveSettings",
    showRowHeaders: function (value) {
      if (this.grid) this.grid.setShowRowHeaders(value);
      this.saveSettings();
    },
    columnFilterMode: function (value) {
      if (this.grid) this.grid.setFilterMode(value);
      this.saveSettings();
    },
    multiSelectRows: function (value) {
      if (this.grid) this.grid.setMultiSelectRows(value);
      this.saveSettings();
    },
    editMode: function (value) {
      if (this.grid) this.grid.setEditMode(value);
      this.saveSettings();
    },
    rowGroupMode: function () {
      this.applyRowGroups();
      this.saveSettings();
    },
    filterText: function () {
      this.applyFilter();
      this.saveSettings();
    },
    quickFilterMode: function () {
      this.applyFilter();
      this.saveSettings();
    },
    pagination: function () {
      this.refreshGridView();
      this.saveSettings();
    },
    remote: function () {
      this.filterText = "";
      this.refreshGridView();
      this.saveSettings();
    },
  },
  beforeDestroy: function () {
    if (this.grid && this.viewportHandler)
      this.grid.off("viewportChanged", this.viewportHandler);
    if (this.grid && this.excelExportingHandler)
      this.grid.off("excelExporting", this.excelExportingHandler);
    if (this.grid && this.excelExportedHandler)
      this.grid.off("excelExported", this.excelExportedHandler);
    if (this.grid && this.excelExportFailedHandler)
      this.grid.off("excelExportFailed", this.excelExportFailedHandler);
    if (this.grid && this.searchClearedHandler)
      this.grid.off("searchCleared", this.searchClearedHandler);
    document.removeEventListener("keydown", this.handleDocumentKeydown);
    document.removeEventListener(
      "fullscreenchange",
      this.handleGridFullscreenChange
    );
    document.removeEventListener(
      "webkitfullscreenchange",
      this.handleGridFullscreenChange
    );
  },
  methods: {
    syncToolbar: function () {
      var state = this.toolbarState;
      window.FabGridDemoToolbar.update(this.$refs.toolbar, {
        datasetSummary: state.datasetSummary,
        text: this.text,
        themes: this.themes,
        values: {
          locale: state.locale,
          theme: state.theme,
          frozenColumns: state.frozenColumns,
          frozenRightColumns: state.frozenRightColumns,
          showRowHeaders: state.showRowHeaders,
          filterMode: state.filterMode,
          pagination: state.pagination,
          remote: state.remote,
          rowGroupMode: state.rowGroupMode,
          multiSelectRows: state.multiSelectRows,
          editMode: state.editMode,
        },
        busy: state.exportBusy,
        fullscreenAvailable: state.fullscreenAvailable,
        fullscreenActive: state.fullscreenActive,
      });
    },
    handleToolbarChange: function (event) {
      var target = event.target;
      if (!target || !target.id) return;
      if (target.id === "languageInput") this.locale = target.value;
      else if (target.id === "themeInput") this.theme = target.value;
      else if (target.id === "frozenInput")
        this.frozenColumns = Number(target.value || 0);
      else if (target.id === "frozenRightInput")
        this.frozenRightColumns = Number(target.value || 0);
      else if (target.id === "rowHeadersInput")
        this.showRowHeaders = normalizeRowHeaderSetting(target.value, true);
      else if (target.id === "groupRowsInput") this.rowGroupMode = target.value;
      else if (target.id === "searchRowInput")
        this.columnFilterMode = target.checked ? ['searchRow', 'excel'] : ['excel', 'searchRow'];
      else if (target.id === "paginationInput")
        this.pagination = target.checked;
      else if (target.id === "remoteInput") this.remote = target.checked;
      else if (target.id === "multiSelectInput")
        this.multiSelectRows = target.checked;
      else if (target.id === "editModeInput") this.editMode = target.checked;
    },
    handleToolbarInput: function (event) {
      var target = event.target;
      if (!target || !target.id) return;
      if (target.id === "frozenInput")
        this.frozenColumns = Number(target.value || 0);
      else if (target.id === "frozenRightInput")
        this.frozenRightColumns = Number(target.value || 0);
    },
    handleToolbarClick: function (event) {
      var button =
        event.target && event.target.closest
          ? event.target.closest("button")
          : null;
      if (!button) return;
      if (button.id === "exportButton") this.exportCsv();
      else if (button.id === "exportExcelButton") this.exportExcel();
      else if (button.id === "fullscreenButton") this.toggleGridFullscreen();
    },
    restoreSettings: function () {
      var settings;
      var raw;
      try {
        raw = window.localStorage
          ? window.localStorage.getItem(SETTINGS_KEY)
          : "";
        settings = raw ? JSON.parse(raw) : null;
      } catch (error) {
        settings = null;
      }
      if (!settings || typeof settings !== "object") return;
      if (
        settings.locale === "zh-TW" ||
        settings.locale === "zh-CN" ||
        settings.locale === "en"
      )
        this.locale = settings.locale;
      if (
        this.themes.some(function (item) {
          return item.value === settings.theme;
        })
      )
        this.theme = settings.theme;
      this.frozenColumns = normalizeInteger(
        settings.frozenColumns,
        this.frozenColumns,
        0,
        6
      );
      this.frozenRightColumns = normalizeInteger(
        settings.frozenRightColumns,
        this.frozenRightColumns,
        0,
        6
      );
      this.showRowHeaders = normalizeRowHeaderSetting(
        settings.showRowHeaders,
        this.showRowHeaders
      );
      this.columnFilterMode = normalizeFilterMode(
        settings.filterMode,
        this.columnFilterMode
      );
      this.pagination = normalizeBoolean(settings.pagination, this.pagination);
      this.remote = normalizeBoolean(settings.remote, this.remote);
      this.multiSelectRows = normalizeBoolean(
        settings.multiSelectRows,
        this.multiSelectRows
      );
      this.editMode = normalizeBoolean(settings.editMode, this.editMode);
      this.rowGroupMode = normalizeRowGroupModeSetting(
        settings.rowGroupMode,
        settings.showRowGroups,
        this.rowGroupMode
      );
      if (settings.searchText != null) {
        this.filterText = String(settings.searchText);
      } else if (settings.filterText != null) {
        this.filterText = String(settings.filterText);
      }
    },
    saveSettings: function () {
      var settings = {
        locale: this.locale,
        theme: this.theme,
        frozenColumns: this.frozenColumns,
        frozenRightColumns: this.frozenRightColumns,
        showRowHeaders: this.showRowHeaders,
        filterMode: this.columnFilterMode,
        pagination: this.pagination,
        remote: this.remote,
        multiSelectRows: this.multiSelectRows,
        editMode: this.editMode,
        rowGroupMode: this.rowGroupMode,
        searchText: this.filterText,
      };
      try {
        if (window.localStorage)
          window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        return;
      }
    },
    handleInitialized: function (grid) {
      var self = this;
      this.grid = grid;
      this.viewportHandler = function (args) {
        self.updateStats(args);
      };
      this.excelExportingHandler = function () {
        self.exportBusy = true;
      };
      this.excelExportedHandler = function () {
        self.exportBusy = false;
      };
      this.excelExportFailedHandler = function () {
        self.exportBusy = false;
      };
      this.searchClearedHandler = function () {
        self.filterText = "";
        grid.setFilter(null);
        self.saveSettings();
      };
      grid.on("viewportChanged", this.viewportHandler);
      grid.on("excelExporting", this.excelExportingHandler);
      grid.on("excelExported", this.excelExportedHandler);
      grid.on("excelExportFailed", this.excelExportFailedHandler);
      grid.on("searchCleared", this.searchClearedHandler);
      window.fabGridDemo = {
        grid: grid,
        rows: this.rows,
        columns: this.columns,
        themes: this.themes,
      };
      this.applyTheme();
      this.applyRowGroups();
      if (this.remote) {
        this.filterText = "";
      } else if (this.filterText) {
        this.applyFilter();
      }
      this.updateStats();
    },
    updateStats: function (args) {
      var totalRows;
      if (!this.grid) return;
      args = args || {};
      totalRows =
        this.grid.options.pagination || this.grid.options.remote === true
          ? this.grid.paginationTotal
          : this.grid.dataView
          ? this.grid.dataView.length
          : this.rows.length;
      this.stats = {
        totalRows: totalRows,
        rowStart:
          args.rowStart == null ? this.grid.rowRange.start : args.rowStart,
        rowEnd: args.rowEnd == null ? this.grid.rowRange.end : args.rowEnd,
        columnStart:
          args.columnStart == null
            ? this.grid.columnRange.start
            : args.columnStart,
        columnEnd:
          args.columnEnd == null ? this.grid.columnRange.end : args.columnEnd,
        renderedCells:
          args.renderedCells == null
            ? this.grid.root.querySelectorAll(".fg-cell").length
            : args.renderedCells,
      };
    },
    applyTheme: function () {
      var self = this;
      if (!this.grid || !this.grid.root) return;
      this.themes.forEach(function (item) {
        self.grid.root.classList.remove("fg-theme-" + item.value);
      });
      this.grid.root.classList.add("fg-theme-" + this.theme);
      this.$nextTick(this.syncDemoFilterHeaderTextStyle);
    },
    syncDemoFilterHeaderTextStyle: function () {
      var filterBar = this.$el
        ? this.$el.querySelector(".demo-filter-bar")
        : null;
      var headerCell =
        this.grid && this.grid.root
          ? this.grid.root.querySelector(".fg-header-cell")
          : null;
      var style;
      if (!filterBar || !headerCell) return;
      style = window.getComputedStyle(headerCell);
      filterBar.style.color = style.color;
      filterBar.style.fontFamily = style.fontFamily;
      filterBar.style.fontSize = style.fontSize;
      filterBar.style.fontWeight = style.fontWeight;
    },
    applyRowGroups: function () {
      if (!this.grid) return;
      this.grid.setRowGroups(
        createRowGroups(this.rowGroupMode, this.locale, this.columns)
      );
      this.updateStats();
    },
    applyFilter: function () {
      var columns = this.columns;
      var terms;
      var mode = this.quickFilterMode;
      if (!this.grid) return;
      if (this.remote) {
        this.grid.setSearch(this.filterText);
        return;
      }
      terms = this.filterText
        .toLowerCase()
        .split(",")
        .map(function (value) {
          return value.trim();
        })
        .filter(Boolean);
      if (!terms.length) {
        this.grid.setFilter(null);
      } else {
        this.grid.setFilter(function (row) {
          return mode === "and"
            ? terms.every(function (term) {
                return columns.some(function (column) {
                  var actual = getDemoFilterBindingValue(row, column.binding);
                  return (
                    String(actual == null ? "" : actual)
                      .toLowerCase()
                      .indexOf(term) >= 0
                  );
                });
              })
            : terms.some(function (term) {
                return columns.some(function (column) {
                  var actual = getDemoFilterBindingValue(row, column.binding);
                  return (
                    String(actual == null ? "" : actual)
                      .toLowerCase()
                      .indexOf(term) >= 0
                  );
                });
              });
        });
      }
      this.updateStats();
    },
    clearFilter: function () {
      this.filterText = "";
      this.$nextTick(function () {
        if (this.$refs.demoFilter) this.$refs.demoFilter.focus();
      });
    },
    toggleFilterMode: function () {
      this.quickFilterMode = this.quickFilterMode === "or" ? "and" : "or";
    },
    refreshGridView: function () {
      if (!this.grid) return;
      this.grid.options.pagination = this.pagination;
      this.grid.options.remote = this.remote;
      this.grid.options.loader = this.loadRemoteRows;
      this.grid.options.pageNumber = 1;
      if (this.grid.options.pager) this.grid.options.pager.pageNumber = 1;
      if (this.remote) {
        this.grid.clearFilter();
        this.grid.setItemsSource([], true);
        this.grid.load();
        return;
      }
      this.grid.setItemsSource(this.rows);
      this.updateStats();
    },
    exportCsv: function () {
      if (this.grid) this.grid.exportCsv("fabgrid-demo.csv");
    },
    exportExcel: function () {
      if (!this.grid) return;
      this.grid.exportExcel("fabgrid-demo.xlsx").catch(function (error) {
        window.setTimeout(function () {
          throw error;
        }, 0);
      });
    },
    toggleGridFullscreen: function () {
      var shell = this.$refs.gridShell;
      var action;
      if (!shell) return;
      if (this.getFullscreenElement() === shell) {
        action = document.exitFullscreen || document.webkitExitFullscreen;
        this.runFullscreenAction(action, document);
        return;
      }
      action = shell.requestFullscreen || shell.webkitRequestFullscreen;
      this.runFullscreenAction(action, shell);
    },
    runFullscreenAction: function (action, context) {
      var result;
      var self = this;
      if (typeof action !== "function") {
        this.updateFullscreenState();
        return;
      }
      try {
        result = action.call(context);
        if (result && typeof result.catch === "function") {
          result.catch(function () {
            self.updateFullscreenState();
          });
        }
      } catch (error) {
        this.updateFullscreenState();
      }
    },
    getFullscreenElement: function () {
      return (
        document.fullscreenElement || document.webkitFullscreenElement || null
      );
    },
    handleGridFullscreenChange: function () {
      var self = this;
      this.updateFullscreenState();
      window.requestAnimationFrame(function () {
        if (!self.grid) return;
        self.grid.refresh();
        self.updateStats();
      });
    },
    updateFullscreenState: function () {
      var shell = this.$refs.gridShell;
      this.fullscreenAvailable = Boolean(
        shell &&
          (shell.requestFullscreen || shell.webkitRequestFullscreen) &&
          (document.exitFullscreen || document.webkitExitFullscreen)
      );
      this.fullscreenActive = this.getFullscreenElement() === shell;
    },
    formatNumber: function (value) {
      var number = Number(value);
      if (!isFinite(number)) return String(value);
      return number.toLocaleString(
        this.locale === "en" ? "en-US" : this.locale
      );
    },
    loadRemoteRows: function (params) {
      var source = this.rows.slice();
      var filterRules = params.filterRules
        ? JSON.parse(params.filterRules)
        : [];
      var sortFields = params.sort ? params.sort.split(",") : [];
      var sortOrders = params.order ? params.order.split(",") : [];
      var start = (params.page - 1) * params.rows;
      source = DEMO_QUERY.filterRemoteRows(source, params.q, filterRules);
      DEMO_QUERY.sortRemoteRows(source, sortFields, sortOrders);
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          resolve({
            total: String(source.length),
            rows: source.slice(start, start + params.rows),
          });
        }, 500);
      });
    },
    openLookupPopup: function (args) {
      var self = this;
      this.lookupEditorArgs = args;
      this.lookupVisible = true;
      this.$nextTick(function () {
        if (self.lookupGrid) {
          self.lookupGrid.invalidate();
          self.lookupGrid.select(
            Math.max(
              0,
              self.lookupGrid.selection ? self.lookupGrid.selection.row : 0
            ),
            0
          );
          window.setTimeout(function () {
            self.lookupGrid.invalidate();
            self.lookupGrid.root.focus();
          }, 0);
        }
      });
    },
    closeLookupPopup: function () {
      this.lookupVisible = false;
      this.lookupEditorArgs = null;
      this.lookupLastClick = null;
    },
    handleDocumentKeydown: function (event) {
      if (event.key === "Escape" && this.lookupVisible) this.closeLookupPopup();
    },
    handleLookupInitialized: function (grid) {
      this.lookupGrid = grid;
    },
    handleLookupClick: function (event) {
      var cell =
        event.target && event.target.closest
          ? event.target.closest(".fg-cell")
          : null;
      var rowHeader =
        event.target && event.target.closest
          ? event.target.closest(".fg-row-header-cell")
          : null;
      var selectionCell =
        event.target && event.target.closest
          ? event.target.closest(".fg-selection-cell")
          : null;
      var rowTarget = cell || rowHeader || selectionCell;
      var rowIndex;
      var now;
      var isDoubleClick;
      if (
        !rowTarget ||
        !this.lookupGrid ||
        !this.lookupGrid.root.contains(rowTarget)
      )
        return;
      rowIndex = Number(rowTarget.getAttribute("data-row"));
      if (!isFinite(rowIndex)) return;
      now = Date.now();
      isDoubleClick =
        event.detail >= 2 ||
        (this.lookupLastClick &&
          this.lookupLastClick.row === rowIndex &&
          now - this.lookupLastClick.time < 450);
      this.lookupGrid.select(rowIndex, 0);
      if (isDoubleClick) {
        event.preventDefault();
        event.stopPropagation();
        this.applyLookupValue();
        this.lookupLastClick = null;
        return;
      }
      this.lookupLastClick = { row: rowIndex, time: now };
    },
    clearLookupSelection: function () {
      if (!this.lookupGrid) return;
      this.lookupGrid.clearFilter();
      this.lookupGrid.setSearch("");
    },
    applyLookupValue: function () {
      var editor = this.lookupEditorArgs && this.lookupEditorArgs.editor;
      var rowIndex;
      var value;
      if (!editor || !this.lookupGrid) {
        this.closeLookupPopup();
        return;
      }
      rowIndex = Math.max(
        0,
        this.lookupGrid.selection ? this.lookupGrid.selection.row : 0
      );
      value = this.lookupGrid.getCellData(rowIndex, 0);
      editor.value = value == null ? "" : String(value);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.focus();
      this.closeLookupPopup();
    },
  },
});

app.$mount("#app");

function createColumns(count, openLookupPopup, locale) {
  var texts = DEMO_LOCALES[locale] || DEMO_LOCALES["zh-TW"];
  var headers = texts.columnHeaders;
  var columns = [
    {
      binding: "facno",
      header: headers.facno,
      width: 88,
      minWidth: 72,
      align: "center",
      dataType: "string",
      readOnly: true,
    },
    {
      binding: "name",
      header: headers.name,
      width: 88,
      minWidth: 88,
      dataType: "string",
      readOnly: true,
    },
    {
      binding: "dlvno",
      header: headers.dlvno,
      width: 140.4,
      minWidth: 100,
      dataType: "string",
      editor: {
        type: "text",
        icons: [
          {
            iconCls: "icon-refwin",
            title: texts.openLookup,
            ariaLabel: texts.openLookup,
            onClick: setOrderReference,
          },
        ],
      },
    },
    {
      binding: "item",
      header: headers.item,
      width: 64,
      minWidth: 56,
      align: "center",
      dataType: "string",
      readOnly: true,
    },
    {
      binding: "date",
      header: headers.date,
      width: 113.5,
      minWidth: 92,
      dataType: "date",
      editor: "date",
      mask: "9999-99-99",
    },
    {
      binding: "cusno",
      header: headers.cusno,
      width: 132,
      minWidth: 110,
      dataType: "string",
      search: {
        icons: [
          {
            iconCls: "icon-refwin",
            title: texts.openLookup,
            ariaLabel: texts.openLookup,
            onClick: openLookupPopup,
          },
        ],
      },
      editor: {
        type: "text",
        icons: [
          {
            iconCls: "icon-refwin",
            title: texts.openLookup,
            ariaLabel: texts.openLookup,
            onClick: openLookupPopup,
          },
        ],
      },
    },
    {
      binding: "stus",
      header: headers.stus,
      width: 120,
      minWidth: 100,
      dataType: "string",
      editor: createWorkflowEditor(locale),
    },
    {
      binding: "color",
      header: headers.color,
      width: 112,
      minWidth: 92,
      dataType: "string",
      editor: { type: "color", showAlpha: true },
    },
    {
      binding: "dlvdt",
      header: headers.dlvdt,
      width: 120,
      minWidth: 100,
      dataType: "string",
      editor: "date",
      mask: "9999/99/99",
      autoUnmask: true,
    },
    {
      binding: "yymm",
      header: headers.yymm,
      width: 90,
      minWidth: 90,
      dataType: "string",
      editor: "date",
      mask: "9999/99",
      autoUnmask: true,
    },
    {
      binding: "amount",
      header: headers.amount,
      width: 140,
      minWidth: 90,
      align: "right",
      color: "blue",
      dataType: "number",
      aggregate: "sum",
      thousandsSeparator: true,
      precision: 2,
      editor: "number",
      validate: function (args) {
        var value = args.value;
        if (
          value != null &&
          (!isFinite(value) || value < 0 || value > 1000000)
        ) {
          return {
            type: "range",
            message: texts.amountRangeValidation,
            value: value,
          };
        }
        return null;
      },
    },
    {
      binding: "score",
      header: headers.score,
      width: 120,
      minWidth: 100,
      align: "right",
      dataType: "number",
      aggregate: "avg",
      editor: "number",
      validate: function (args) {
        return new Promise(function (resolve) {
          window.setTimeout(function () {
            var value = args.value;
            resolve(
              value != null && (!isFinite(value) || value < 0 || value > 100)
                ? {
                    type: "range",
                    message: texts.scoreRangeValidation,
                    value: value,
                  }
                : null
            );
          }, 120);
        });
      },
      footerFormatter: function (value) {
        if (value == null || value === "") return "";
        return Number(value).toLocaleString(
          locale === "en" ? "en-US" : locale,
          {
            maximumFractionDigits: 1,
          }
        );
      },
    },
    {
      binding: "rem",
      header: headers.rem,
      width: 240,
      minWidth: 120,
      dataType: "string",
    },
  ];
  var index;
  for (index = columns.length + 1; index <= count; index += 1) {
    columns.push({
      binding: "col" + pad(index),
      header: headers.defaultColumn.replace("{index}", index),
      width: index % 3 === 0 ? 150 : 120,
      minWidth: 80,
      dataType: index % 4 === 0 ? "number" : "string",
      align: index % 4 === 0 ? "right" : "",
      aggregate: index % 4 === 0 ? "sum" : null,
    });
  }
  return columns;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function normalizeInteger(value, fallback, min, max) {
  value = Number(value);
  if (!isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeBoolean(value, fallback) {
  return value === true || value === false ? value : fallback;
}

function normalizeFilterMode(value, fallback) {
  var result = [];
  if (value === false) return false;
  (Array.isArray(value) ? value : fallback).forEach(function(mode) {
    if ((mode === 'excel' || mode === 'searchRow') && result.indexOf(mode) < 0) {
      result.push(mode);
    }
  });
  return result.length ? result : false;
}

function normalizeRowGroupModeSetting(value, legacyValue, fallback) {
  var text = value == null ? "" : String(value).toLowerCase();
  if (
    text === "none" ||
    text === "order" ||
    text === "vendor" ||
    text === "vendor-order"
  ) {
    return text;
  }
  if (legacyValue === false) return "none";
  if (legacyValue === true) return "order";
  return fallback;
}

function normalizeRowHeaderSetting(value, fallback) {
  var text;
  if (value === true || value === false || value === "cell") return value;
  text = value == null ? "" : String(value).toLowerCase();
  if (text === "true" || text === "number" || text === "row-number")
    return true;
  if (text === "cell" || text === "blank") return "cell";
  if (text === "false" || text === "none" || text === "off") return false;
  return fallback;
}

function getDemoFilterBindingValue(item, binding) {
  var parts = String(binding || "").split(".");
  var value = item;
  var index;
  for (index = 0; index < parts.length; index += 1) {
    if (value == null) return "";
    value = value[parts[index]];
  }
  return value;
}

function setOrderReference(args) {
  if (!args || !args.editor) return;
  args.editor.value = "BO" + pad(args.row + 1) + "001";
  args.editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function formatDemoCell(args) {
  var style;
  if (!args || !args.column || args.column.binding !== "stus") return;
  style = STATUS_STYLES[String(args.value || "").toLowerCase()];
  if (!style) return;
  args.cell.className += " " + style.cssClass;
  args.cell.style.color = style.color;
}

function formatLookupCell(args) {
  if (
    !args ||
    !args.column ||
    args.column.binding !== "status" ||
    args.value === "買單"
  )
    return;
  args.cell.style.color = "#1d4ed8";
  args.cell.style.fontWeight = "600";
}

function createRowGroups(mode, locale, columns) {
  var formatHeader = function (args) {
    return formatRowGroupHeader(args, locale, columns);
  };
  var formatVendorOrder = function (args) {
    return formatVendorOrderGroupHeader(args, locale, columns);
  };
  if (mode === "order") return [{ binding: "dlvno", header: formatHeader }];
  if (mode === "vendor")
    return [{ binding: ["facno", "dlvno"], header: formatVendorOrder }];
  if (mode === "vendor-order") {
    return [
      { binding: "facno", header: formatHeader },
      { binding: "dlvno", header: formatHeader },
    ];
  }
  return [];
}

function formatRowGroupHeader(args, locale, columns) {
  var text = DEMO_LOCALES[locale] || DEMO_LOCALES["zh-TW"];
  return formatText(text.groupHeader, {
    header: getRowGroupHeaderText(args, columns, text),
    key: args.key,
    count: args.count,
  });
}

function formatVendorOrderGroupHeader(args, locale, columns) {
  var text = DEMO_LOCALES[locale] || DEMO_LOCALES["zh-TW"];
  var item = args.item || {};
  return formatText(text.groupVendorOrderHeader, {
    header: getRowGroupHeaderText(args, columns, text),
    vendor: item.facno,
    order: item.dlvno,
    count: args.count,
  });
}

function getRowGroupHeaderText(args, columns, text) {
  var bindings =
    args.config &&
    (args.config.bindings ||
      args.config.binding ||
      args.config.fields ||
      args.config.field);
  if (args.header) return args.header;
  if (bindings == null) {
    bindings =
      args.key === (args.item && args.item.facno)
        ? "facno"
        : args.key === (args.item && args.item.dlvno)
        ? "dlvno"
        : ["facno", "dlvno"];
  }
  if (!Array.isArray(bindings)) bindings = [bindings];
  return (
    bindings
      .map(function (binding) {
        return getGroupColumnHeader(binding, columns);
      })
      .join(" + ") || text.groupRows
  );
}

function getGroupColumnHeader(binding, columns) {
  var index;
  for (index = 0; index < columns.length; index += 1) {
    if (columns[index].binding === binding) return columns[index].header;
  }
  return String(binding);
}

function formatText(text, data) {
  return String(text == null ? "" : text).replace(
    /\{([^}]+)\}/g,
    function (match, key) {
      return data && Object.prototype.hasOwnProperty.call(data, key)
        ? data[key]
        : match;
    }
  );
}

function createLookupColumns(locale) {
  var localePack = DEMO_LOCALES[locale] || DEMO_LOCALES["zh-TW"];
  var headers = localePack.lookupColumnHeaders;
  return [
    {
      binding: "code",
      header: headers.code,
      width: 96,
      minWidth: 70,
      dataType: "string",
    },
    {
      binding: "orderNo",
      header: headers.orderNo,
      width: 128,
      minWidth: 100,
      dataType: "string",
    },
    {
      binding: "customer",
      header: headers.customer,
      width: 90,
      minWidth: 80,
      dataType: "string",
    },
    {
      binding: "name",
      header: headers.name,
      width: 100,
      minWidth: 80,
      dataType: "string",
    },
    {
      binding: "qty",
      header: headers.qty,
      width: 96,
      minWidth: 80,
      align: "right",
      dataType: "number",
    },
    {
      binding: "available",
      header: headers.available,
      width: 96,
      minWidth: 80,
      align: "right",
      dataType: "number",
    },
    {
      binding: "price",
      header: headers.price,
      width: 84,
      minWidth: 70,
      align: "right",
      dataType: "number",
    },
    {
      binding: "status",
      header: headers.status,
      width: 96,
      minWidth: 80,
      dataType: "string",
    },
  ];
}

function createWorkflowEditor(locale) {
  var localePack = DEMO_LOCALES[locale] || DEMO_LOCALES["zh-TW"];
  var labels = localePack.workflowLabels;
  return {
    type: "combo",
    valueField: "value",
    textField: "text",
    limitToList: true,
    showValueInList: true,
    data: window.FabGridDemoData.workflowValues.map(function (value, index) {
      return { value: value, text: labels[index] };
    }),
  };
}
</script>

<style>
@import "../src/fabui.css";
@import "./style/my.icon.css";
@import "./style/style.css";
</style>
