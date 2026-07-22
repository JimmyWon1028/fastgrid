// Grid demo entry.
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Demo configuration and static data
  // ---------------------------------------------------------------------------

  if (!window.FabGridDemoData || !Array.isArray(window.FabGridDemoData.rows)) {
    throw new Error("FabGrid demo data source is not loaded.");
  }
  if (!window.FabGridDemoQuery) {
    throw new Error("FabGrid demo query helpers are not loaded.");
  }
  if (!window.FabGridDemoLocales) {
    throw new Error("FabGrid demo locales are not loaded.");
  }
  if (!window.FabGridDemoToolbar) {
    throw new Error("FabGrid demo toolbar is not loaded.");
  }
  var DEMO_QUERY = window.FabGridDemoQuery;
  var DEMO_COLUMN_COUNT = window.FabGridDemoData.columnCount;
  var DEMO_ROW_HEADER_WIDTH = 50;
  var DEMO_SETTINGS_KEY =
    window.FABGRID_DEMO_SETTINGS_KEY ||
    "fabgrid.demo.settings.v4.default-toolbar-state";
  var DEFAULT_DEMO_SETTINGS = {
    locale: "zh-TW",
    theme: "default",
    searchText: "",
    frozenColumns: 2,
    frozenRightColumns: 1,
    showRowHeaders: true,
    filterMode: ["excel", "searchRow"],
    pagination: false,
    remote: false,
    rowGroupMode: "none",
    multiSelectRows: false,
    editMode: false,
  };
  var DEMO_LOCALES = window.FabGridDemoLocales;
  var DEMO_THEMES = [
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
    { value: "mono", label: "Mono" },
    { value: "mono-red", label: "Mono Red" },
    { value: "mono-green", label: "Mono Green" },
  ];
  var DEMO_WORKFLOW_VALUES = window.FabGridDemoData.workflowValues;
  var DEMO_STATUS_STYLES = {
    draft: { className: "status-draft", color: "#6b7280" },
    pending: { className: "status-pending", color: "#b45309" },
    approved: { className: "status-approved", color: "#047857" },
    closed: { className: "status-closed", color: "#1d4ed8" },
  };
  var DEMO_ROW_GROUPS = {
    order: [
      {
        binding: "dlvno",
        header: formatDemoRowGroupHeader,
      },
    ],
    vendor: [
      {
        binding: ["facno", "dlvno"],
        header: formatDemoVendorOrderRowGroupHeader,
      },
    ],
    "vendor-order": [
      {
        binding: "facno",
        header: formatDemoRowGroupHeader,
      },
      {
        binding: "dlvno",
        header: formatDemoRowGroupHeader,
      },
    ],
  };
  var rows = window.FabGridDemoData.rows;
  var columns = createColumns(DEMO_COLUMN_COUNT);
  var gridShell = document.querySelector(".grid-shell");
  var fullscreenButton = document.getElementById("fullscreenButton");
  var toolbarIconOnly =
    document.body.getAttribute("data-grid-toolbar-icon-only") === "true";
  var stats = {
    datasetSummary: document.getElementById("datasetSummary"),
    rowCount: document.getElementById("rowCount"),
    rowRange: document.getElementById("rowRange"),
    columnRange: document.getElementById("columnRange"),
    cellCount: document.getElementById("cellCount"),
  };
  var controls = {
    language: document.getElementById("languageInput"),
    theme: document.getElementById("themeInput"),
    frozen: document.getElementById("frozenInput"),
    frozenRight: document.getElementById("frozenRightInput"),
    rowHeaders: document.getElementById("rowHeadersInput"),
    filtering: document.getElementById("searchRowInput"),
    pagination: document.getElementById("paginationInput"),
    remote: document.getElementById("remoteInput"),
    groupRows: document.getElementById("groupRowsInput"),
    multiSelect: document.getElementById("multiSelectInput"),
    editMode: document.getElementById("editModeInput"),
    demoFilter: document.getElementById("demoFilterInput"),
    demoFilterMode: document.getElementById("demoFilterMode"),
    demoFilterClear: document.getElementById("demoFilterClear"),
  };
  var labels = {
    language: document.getElementById("languageLabel"),
    theme: document.getElementById("themeLabel"),
    frozen: document.getElementById("frozenLabel"),
    frozenRight: document.getElementById("frozenRightLabel"),
    rowHeaders: document.getElementById("rowHeadersLabel"),
    filtering: document.getElementById("searchRowLabel"),
    pagination: document.getElementById("paginationLabel"),
    remote: document.getElementById("remoteLabel"),
    groupRows: document.getElementById("groupRowsLabel"),
    multiSelect: document.getElementById("multiSelectLabel"),
    editMode: document.getElementById("editModeLabel"),
    demoResultCount: document.getElementById("demoResultCount"),
    demoFilter: document.getElementById("demoFilterLabel"),
    exportCsv: document.getElementById("exportButton"),
    exportExcel: document.getElementById("exportExcelButton"),
    fullscreen: fullscreenButton,
  };
  var toolbarControls = document.querySelectorAll(
    ".toolbar input, .toolbar select, .toolbar button"
  );
  var lookupPopup = null;
  var lookupGrid = null;
  var lookupEditorArgs = null;
  var lookupLastClick = null;
  var demoFilterMode = "or";
  var demoSettings = null;
  var grid = null;

  // Create the grid through an optional framework adapter.
  function createGridControl(host, options) {
    if (typeof window.FabGridDemoCreateControl === "function")
      return window.FabGridDemoCreateControl(host, options);
    return new fabui.FabGrid(host, options);
  }

  // ---------------------------------------------------------------------------
  // Application bootstrap
  // ---------------------------------------------------------------------------

  function initializeDemo() {
    populateThemeOptions();

    demoSettings = loadDemoSettings();
    applyDemoSettingsToControls(demoSettings);
    applyDemoLocale(demoSettings.locale);
    applyColumnHeaderLocale(columns, demoSettings.locale);

    grid = createGridControl("#grid", createGridOptions(demoSettings));
    initializeDemoFilterTextBox();
    updateDemoFilterAvailability(demoSettings.remote);
    applyDemoTheme(demoSettings.theme);

    if (demoSettings.searchText && !demoSettings.remote) {
      applyDemoFilter(demoSettings.searchText);
    }

    bindGridEvents();
    bindToolbarEvents();
    updateDatasetSummary();
    refreshViewportStats();
    exposeDemoApi();
  }

  function createGridOptions(settings) {
    return {
      rowHeight: 32,
      headerHeight: 32,
      // activeCellBorder: 2,
      searchDelay: 400,
      overscanRows: 14,
      overscanColumns: 3,
      frozenColumns: settings.frozenColumns,
      frozenRightColumns: settings.frozenRightColumns,
      locale: settings.locale,
      showRowHeaders: settings.showRowHeaders,
      rowHeaderWidth: DEMO_ROW_HEADER_WIDTH,
      observeItemsSource: true,
      remote: settings.remote,
      loader: loadRemoteRows,
      pagination: settings.pagination,
      pager: {
        pageNumber: 1,
        pageSize: 100,
        pageList: [10, 20, 30, 40, 50, 100, 500],
        showPageList: false,
        showPageInfo: true,
        showRefresh: true,
      },
      filterMode: settings.filterMode,
      // showFooter: true,
      footerHeight: 32,
      multiSelectRows: settings.multiSelectRows,
      itemsSource: rows,
      columns: columns,
      rowGroups: getDemoRowGroups(settings.rowGroupMode),
      allowSorting: true,
      allowDragging: "Columns",
      allowEditing: settings.editMode,
      editOnSelect: settings.editMode,
      allowResizing: true,
      alternatingRowStep: 1,
      headerToggleKey: "f4",
      formatCell: formatDemoCell,
    };
  }

  function formatDemoCell(args) {
    var statusStyle;

    if (args.column.binding !== "stus") {
      return;
    }

    statusStyle = DEMO_STATUS_STYLES[String(args.value || "").toLowerCase()];
    if (!statusStyle) {
      return;
    }

    args.cell.className += " " + statusStyle.className;
    args.cell.style.color = statusStyle.color;
  }

  // Simulate a server request while keeping the Demo self-contained.
  function loadRemoteRows(params) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        var remoteRows = rows.slice();
        var filterRules = params.filterRules
          ? JSON.parse(params.filterRules)
          : [];
        var sortFields = params.sort ? params.sort.split(",") : [];
        var sortOrders = params.order ? params.order.split(",") : [];
        var start = (params.page - 1) * params.rows;

        remoteRows = DEMO_QUERY.filterRemoteRows(
          remoteRows,
          params.q,
          filterRules
        );
        DEMO_QUERY.sortRemoteRows(remoteRows, sortFields, sortOrders);
        resolve({
          total: String(remoteRows.length),
          rows: remoteRows.slice(start, start + params.rows),
        });
      }, 500);
    });
  }

  // Keep grid events separate from toolbar DOM events for easier maintenance.
  function bindGridEvents() {
    grid.on("viewportChanged", updateViewportStats);
    grid.on("searchCleared", function () {
      setDemoFilterValue("");
      grid.setFilter(null);
      saveCurrentDemoSettings();
    });
    grid.on("filterModeChanged", function (event) {
      demoSettings.filterMode = event.filterMode === false
        ? false
        : event.filterMode.slice();
      controls.filtering.checked = event.filterMode !== false;
      saveCurrentDemoSettings();
    });
    grid.on("rowHeaderModeChanged", function (event) {
      controls.rowHeaders.value =
        event.mode === true ? "true" : event.mode === "cell" ? "cell" : "false";
      saveCurrentDemoSettings();
    });
    grid.on("loadSuccess", updateDemoResultCount);
    grid.on("excelExporting", function () {
      setToolbarBusy(true);
    });
    grid.on("excelExported", function () {
      setToolbarBusy(false);
    });
    grid.on("excelExportFailed", function () {
      setToolbarBusy(false);
    });
  }

  function bindToolbarEvents() {
    controls.demoFilter.addEventListener("input", function (event) {
      applyDemoFilter(event.target.value);
      saveCurrentDemoSettings();
    });
    controls.demoFilterClear.addEventListener("click", function () {
      setDemoFilterValue("");
      applyDemoFilter("");
      focusDemoFilter();
      saveCurrentDemoSettings();
    });
    controls.demoFilterMode.addEventListener("click", toggleDemoFilterMode);
    controls.language.addEventListener("change", handleLanguageChange);
    controls.theme.addEventListener("change", function (event) {
      applyDemoTheme(event.target.value);
      saveCurrentDemoSettings();
    });
    controls.frozen.addEventListener("input", function (event) {
      grid.setFrozenColumns(Number(event.target.value || 0));
      saveCurrentDemoSettings();
    });
    controls.frozenRight.addEventListener("input", function (event) {
      grid.setFrozenRightColumns(Number(event.target.value || 0));
      saveCurrentDemoSettings();
    });
    controls.rowHeaders.addEventListener("change", function (event) {
      grid.setShowRowHeaders(
        normalizeRowHeaderSetting(
          event.target.value,
          DEFAULT_DEMO_SETTINGS.showRowHeaders
        )
      );
      saveCurrentDemoSettings();
    });
    controls.filtering.addEventListener("change", function (event) {
      if (grid.setAllowFiltering) {
        grid.setAllowFiltering(event.target.checked);
      }
      demoSettings.filterMode = grid.getFilterMode();
      controls.filtering.checked = demoSettings.filterMode !== false;
      saveCurrentDemoSettings();
    });
    controls.pagination.addEventListener("change", handleDataModeChange);
    controls.remote.addEventListener("change", handleDataModeChange);
    bindOptionalToolbarEvents();
    bindExportEvents();
    bindFullscreenEvents();
  }

  function bindOptionalToolbarEvents() {
    if (controls.groupRows) {
      controls.groupRows.addEventListener("change", function (event) {
        grid.setRowGroups(getDemoRowGroups(event.target.value));
        saveCurrentDemoSettings();
        refreshViewportStats();
      });
    }
    controls.multiSelect.addEventListener("change", function (event) {
      grid.setMultiSelectRows(event.target.checked);
      saveCurrentDemoSettings();
    });
    controls.editMode.addEventListener("change", function (event) {
      grid.setEditMode(event.target.checked);
      saveCurrentDemoSettings();
    });
  }

  function bindExportEvents() {
    labels.exportCsv.addEventListener("click", function () {
      grid.exportCsv("fabgrid-demo.csv");
    });
    labels.exportExcel.addEventListener("click", function () {
      grid.exportExcel("fabgrid-demo.xlsx").catch(function (error) {
        window.setTimeout(function () {
          throw error;
        }, 0);
      });
    });
  }

  function bindFullscreenEvents() {
    labels.fullscreen.addEventListener("click", toggleGridFullscreen);
    document.addEventListener("fullscreenchange", handleGridFullscreenChange);
    if (!("onfullscreenchange" in document)) {
      document.addEventListener(
        "webkitfullscreenchange",
        handleGridFullscreenChange
      );
    }
    updateFullscreenButton();
  }

  function toggleGridFullscreen() {
    var action;
    if (getFullscreenElement() === gridShell) {
      action = document.exitFullscreen || document.webkitExitFullscreen;
      runFullscreenAction(action, document);
      return;
    }
    action = gridShell.requestFullscreen || gridShell.webkitRequestFullscreen;
    runFullscreenAction(action, gridShell);
  }

  function runFullscreenAction(action, context) {
    var result;
    if (typeof action !== "function") {
      updateFullscreenButton();
      return;
    }
    try {
      result = action.call(context);
      if (result && typeof result.catch === "function") {
        result.catch(updateFullscreenButton);
      }
    } catch (error) {
      updateFullscreenButton();
    }
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement || document.webkitFullscreenElement || null
    );
  }

  function handleGridFullscreenChange() {
    updateFullscreenButton();
    window.requestAnimationFrame(function () {
      if (grid) {
        grid.refresh();
        refreshViewportStats();
      }
    });
  }

  function updateFullscreenButton() {
    var available = Boolean(
      gridShell &&
        (gridShell.requestFullscreen || gridShell.webkitRequestFullscreen) &&
        (document.exitFullscreen || document.webkitExitFullscreen)
    );
    var active = getFullscreenElement() === gridShell;
    var text = getDemoText(active ? "exitFullscreen" : "fullscreen");
    if (!available) {
      text = getDemoText("fullscreenUnavailable");
    }
    labels.fullscreen.disabled = !available;
    labels.fullscreen.textContent = toolbarIconOnly ? "" : text;
    labels.fullscreen.setAttribute("aria-label", text);
    labels.fullscreen.setAttribute("title", text);
    labels.fullscreen.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function handleLanguageChange(event) {
    var locale = normalizeLocaleSetting(
      event.target.value,
      DEFAULT_DEMO_SETTINGS.locale
    );
    grid.setLocale(locale);
    applyDemoLocale(locale);
    applyGridColumnHeaderLocale(grid, locale);
    refreshDemoRowGroups();
    saveCurrentDemoSettings();
    refreshViewportStats();
  }

  function handleDataModeChange() {
    applyDemoDataMode();
    saveCurrentDemoSettings();
  }

  function exposeDemoApi() {
    window.fabGridDemo = {
      grid: grid,
      rows: rows,
      columns: columns,
      themes: DEMO_THEMES,
    };
  }

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  function createColumns(count) {
    var columns = [
      {
        binding: "facno",
        header: "主要廠商",
        width: 88,
        minWidth: 72,
        align: "center",
        dataType: "string",
        readOnly: true,
      },
      {
        binding: "name",
        header: "簡稱",
        width: 88,
        minWidth: 88,
        dataType: "string",
        readOnly: true,
      },
      {
        binding: "dlvno",
        header: "訂單編號",
        width: 140.4,
        // minWidth: 100,
        dataType: "string",
        editor: {
          type: "text",
          icons: [
            {
              iconCls: "icon-refwin",
              title: "選擇參照",
              ariaLabel: "選擇參照",
              onClick: function (args) {
                args.editor.value = "BO" + pad(args.row + 1) + "001";
                args.editor.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
              },
            },
          ],
        },
      },
      {
        binding: "item",
        header: "項目",
        width: 64,
        minWidth: 56,
        align: "center",
        dataType: "string",
        readOnly: true,
      },
      {
        binding: "date",
        header: "單據日期",
        width: 113.5,
        minWidth: 92,
        dataType: "date",
        editor: {
          type: "date",
        },
        mask: "9999-99-99",
      },
      {
        binding: "cusno",
        header: "客戶",
        width: 132,
        minWidth: 110,
        dataType: "string",
        search: {
          icons: [
            {
              iconCls: "icon-refwin",
              title: getDemoLocalePack(DEFAULT_DEMO_SETTINGS.locale).openLookup,
              ariaLabel: getDemoLocalePack(DEFAULT_DEMO_SETTINGS.locale)
                .openLookup,
              onClick: showLookupPopup,
            },
          ],
        },
        editor: {
          type: "text",
          icons: [
            {
              iconCls: "icon-refwin",
              title: getDemoLocalePack(DEFAULT_DEMO_SETTINGS.locale).openLookup,
              ariaLabel: getDemoLocalePack(DEFAULT_DEMO_SETTINGS.locale)
                .openLookup,
              onClick: showLookupPopup,
            },
          ],
        },
      },
      {
        binding: "stus",
        header: "狀態",
        width: 120,
        minWidth: 100,
        dataType: "string",
        editor: {
          type: "combo",
          valueField: "value",
          textField: "text",
          limitToList: true,
          showValueInList: true,
          data: getWorkflowComboboxData("zh-TW"),
        },
      },
      {
        binding: "color",
        header: "顏色",
        width: 112,
        minWidth: 92,
        dataType: "string",
        editor: {
          type: "color",
          showAlpha: true,
        },
      },
      {
        binding: "dlvdt",
        header: "文字日期",
        width: 120,
        dataType: "string",
        editor: "date",
        readOnly: false,
        mask: "9999/99/99",
        autoUnmask: true,
      },
      {
        binding: "yymm",
        header: "年月",
        width: 90,
        minWidth: 90,
        dataType: "string",
        editor: "date",
        mask: "9999/99",
        autoUnmask: true,
      },
      {
        binding: "amount",
        header: "應付金額",
        width: 140,
        // minWidth: 90,
        align: "right",
        color: "blue",
        dataType: "number",
        aggregate: "sum",
        thousandsSeparator: true,
        precision: 2,
        editor: {
          type: "number",
          spinner: true,
          increment: 1,
          min: 0,
          max: 1000000,
        },
        validate: function (args) {
          var value = args.value;
          if (
            value != null &&
            (!isFinite(value) || value < 0 || value > 1000000)
          ) {
            return {
              type: "range",
              message: getDemoText("amountRangeValidation"),
              value: args.value,
            };
          }
          return null;
        },
      },
      {
        binding: "score",
        header: "分數(非同步)",
        width: 120,
        minWidth: 100,
        align: "right",
        dataType: "number",
        aggregate: "avg",
        editor: {
          type: "number",
          spinner: "left",
          increment: 1,
          min: 0,
          max: 100,
        },
        validate: function (args) {
          return new Promise(function (resolve) {
            var value = args.value;
            setTimeout(function () {
              if (
                value != null &&
                (!isFinite(value) || value < 0 || value > 100)
              ) {
                resolve({
                  type: "range",
                  message: getDemoText("scoreRangeValidation"),
                  value: args.value,
                });
                return;
              }
              resolve(null);
            }, 120);
          });
        },
        footerFormatter: function (value) {
          if (value == null || value === "") {
            return "";
          }
          return Number(value).toLocaleString("zh-TW", {
            maximumFractionDigits: 1,
          });
        },
      },
      {
        binding: "rem",
        header: "摘要",
        width: 240,
        minWidth: 120,
        dataType: "string",
      },
    ];
    var i;
    for (i = columns.length + 1; i <= count; i += 1) {
      columns.push({
        binding: "col" + pad(i),
        header: "欄位 " + i,
        width: i % 3 === 0 ? 150 : 120,
        minWidth: 80,
        dataType: i % 4 === 0 ? "number" : "string",
        align: i % 4 === 0 ? "right" : "",
        aggregate: i % 4 === 0 ? "sum" : null,
      });
    }
    return columns;
  }

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  // ---------------------------------------------------------------------------
  // Lookup popup
  // ---------------------------------------------------------------------------

  function showLookupPopup(args) {
    lookupEditorArgs = args;
    ensureLookupPopup();
    lookupPopup.overlay.style.display = "flex";
    if (!lookupGrid) {
      lookupGrid = createGridControl(lookupPopup.gridHost, {
        rowHeight: 32,
        headerHeight: 32,
        overscanRows: 4,
        overscanColumns: 1,
        showRowHeaders: true,
        rowHeaderWidth: 42,
        allowSorting: true,
        allowEditing: false,
        editOnSelect: false,
        itemsSource: window.FabGridDemoData.lookupRows,
        columns: createLookupColumns(controls.language.value),
        alternatingRowStep: 1,
        formatCell: function (cellArgs) {
          if (
            cellArgs.column.binding === "status" &&
            cellArgs.value !== "買單"
          ) {
            cellArgs.cell.style.color = "#1d4ed8";
            cellArgs.cell.style.fontWeight = "600";
          }
        },
      });
      lookupGrid.select(0, 0);
      lookupPopup.gridHost.addEventListener(
        "click",
        handleLookupGridClick,
        true
      );
      lookupPopup.gridHost.addEventListener(
        "dblclick",
        handleLookupGridDblClick,
        true
      );
    } else {
      lookupGrid.invalidate();
      lookupGrid.select(Math.max(0, lookupGrid.selection.row), 0);
    }
    applyLookupPopupLocale(controls.language.value);
    window.setTimeout(function () {
      lookupGrid.invalidate();
      lookupGrid.root.focus();
    }, 0);
  }

  function ensureLookupPopup() {
    var overlay;
    var windowEl;
    var header;
    var title;
    var headerControls;
    var closeButton;
    var gridHost;
    var pager;
    var page;
    var count;
    var footer;
    var clearButton;
    var cancelButton;
    var okButton;
    if (lookupPopup) {
      return;
    }
    overlay = document.createElement("div");
    overlay.className = "lookup-popup-overlay";
    overlay.setAttribute("role", "presentation");

    windowEl = document.createElement("section");
    windowEl.className = "lookup-popup-window";
    windowEl.setAttribute("role", "dialog");
    windowEl.setAttribute("aria-modal", "true");

    header = document.createElement("div");
    header.className = "lookup-popup-header";

    title = document.createElement("h2");
    title.className = "lookup-popup-title";

    headerControls = document.createElement("div");
    headerControls.className = "lookup-popup-controls";

    closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "lookup-popup-icon-button icon-close";
    headerControls.appendChild(closeButton);
    header.appendChild(title);
    header.appendChild(headerControls);

    gridHost = document.createElement("div");
    gridHost.className = "lookup-popup-grid";

    pager = document.createElement("div");
    pager.className = "lookup-popup-pager";
    pager.innerHTML =
      "<span>|‹</span><span>‹</span><strong></strong><span>›</span><span>›|</span><span>↻</span>";
    page = pager.querySelector("strong");

    count = document.createElement("span");
    count.className = "lookup-popup-count";
    pager.appendChild(count);

    footer = document.createElement("div");
    footer.className = "lookup-popup-footer";

    clearButton = document.createElement("a");
    clearButton.href = "javascript:void(0)";
    clearButton.className = "lookup-popup-button icon-clear";

    cancelButton = document.createElement("a");
    cancelButton.href = "javascript:void(0)";
    cancelButton.className = "lookup-popup-button icon-remove";

    okButton = document.createElement("a");
    okButton.href = "javascript:void(0)";
    okButton.className = "lookup-popup-button icon-check";

    footer.appendChild(clearButton);
    footer.appendChild(cancelButton);
    footer.appendChild(okButton);
    windowEl.appendChild(header);
    windowEl.appendChild(gridHost);
    windowEl.appendChild(pager);
    windowEl.appendChild(footer);
    overlay.appendChild(windowEl);
    document.body.appendChild(overlay);

    lookupPopup = {
      overlay: overlay,
      title: title,
      gridHost: gridHost,
      page: page,
      count: count,
      closeButton: closeButton,
      clearButton: clearButton,
      cancelButton: cancelButton,
      okButton: okButton,
      locale: null,
    };
    applyLookupPopupLocale(controls.language.value);

    closeButton.addEventListener("click", closeLookupPopup);
    cancelButton.addEventListener("click", closeLookupPopup);
    okButton.addEventListener("click", function () {
      applyLookupPopupValue();
    });
    clearButton.addEventListener("click", function () {
      if (lookupGrid) {
        lookupGrid.clearFilter();
        lookupGrid.setSearch("");
      }
    });
    overlay.addEventListener("mousedown", function (event) {
      if (event.target === overlay) {
        closeLookupPopup();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (
        event.key === "Escape" &&
        lookupPopup &&
        lookupPopup.overlay.style.display === "flex"
      ) {
        closeLookupPopup();
      }
    });
  }

  function createLookupColumns(locale) {
    var headers = getDemoLocalePack(locale).lookupColumnHeaders;
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

  function applyLookupPopupLocale(locale) {
    var count;
    var localeChanged;
    var pack;
    if (!lookupPopup) {
      return;
    }
    locale = normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale);
    localeChanged = lookupPopup.locale !== locale;
    count = lookupGrid ? lookupGrid.view.length : 0;
    pack = getDemoLocalePack(locale);
    lookupPopup.title.textContent = pack.popupGridTitle;
    lookupPopup.page.textContent = pack.lookupPage;
    lookupPopup.count.textContent = formatDemoText(pack.lookupRange, {
      count: count,
    });
    lookupPopup.closeButton.title = pack.close;
    lookupPopup.closeButton.setAttribute("aria-label", pack.close);
    lookupPopup.clearButton.textContent = pack.clearFilter;
    lookupPopup.cancelButton.textContent = pack.cancel;
    lookupPopup.okButton.textContent = pack.confirm;
    if (lookupGrid && localeChanged) {
      lookupGrid.setColumns(createLookupColumns(locale));
    }
    lookupPopup.locale = locale;
  }

  function applyLookupPopupValue(rowIndex) {
    var value;
    if (!lookupGrid || !lookupEditorArgs || !lookupEditorArgs.editor) {
      closeLookupPopup();
      return;
    }
    rowIndex =
      rowIndex == null
        ? Math.max(0, lookupGrid.selection ? lookupGrid.selection.row : 0)
        : rowIndex;
    value = lookupGrid.getCellData(rowIndex, 0);
    lookupEditorArgs.editor.value = value == null ? "" : String(value);
    lookupEditorArgs.editor.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    lookupEditorArgs.editor.focus();
    closeLookupPopup();
  }

  function handleLookupGridDblClick(event) {
    var rowIndex = getLookupEventRowIndex(event);
    if (rowIndex == null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    lookupGrid.select(rowIndex, 0);
    applyLookupPopupValue(rowIndex);
  }

  function handleLookupGridClick(event) {
    var rowIndex = getLookupEventRowIndex(event);
    var now;
    var isDoubleClick;
    if (rowIndex == null) {
      return;
    }
    now = Date.now();
    isDoubleClick =
      event.detail >= 2 ||
      (lookupLastClick &&
        lookupLastClick.row === rowIndex &&
        now - lookupLastClick.time < 450);
    lookupGrid.select(rowIndex, 0);
    if (isDoubleClick) {
      event.preventDefault();
      event.stopPropagation();
      applyLookupPopupValue(rowIndex);
      lookupLastClick = null;
      return;
    }
    lookupLastClick = {
      row: rowIndex,
      time: now,
    };
  }

  function getLookupEventRowIndex(event) {
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
    if (!rowTarget || !lookupGrid || !lookupGrid.root.contains(rowTarget)) {
      return null;
    }
    rowIndex = Number(rowTarget.getAttribute("data-row"));
    if (!isFinite(rowIndex)) {
      return null;
    }
    return rowIndex;
  }

  function closeLookupPopup() {
    if (lookupPopup) {
      lookupPopup.overlay.style.display = "none";
    }
    lookupEditorArgs = null;
    lookupLastClick = null;
  }

  // ---------------------------------------------------------------------------
  // Persisted settings and control state
  // ---------------------------------------------------------------------------

  function setToolbarBusy(value) {
    var i;
    for (i = 0; i < toolbarControls.length; i += 1) {
      toolbarControls[i].disabled = value === true;
    }
    if (value !== true) {
      updateFullscreenButton();
    }
  }

  function loadDemoSettings() {
    var settings = null;
    var raw;
    try {
      raw = window.localStorage
        ? window.localStorage.getItem(DEMO_SETTINGS_KEY)
        : "";
      settings = raw ? JSON.parse(raw) : null;
    } catch (error) {
      settings = null;
    }
    return normalizeDemoSettings(settings);
  }

  function saveCurrentDemoSettings() {
    saveDemoSettings({
      locale: controls.language.value,
      theme: controls.theme.value,
      searchText: getDemoFilterValue(),
      frozenColumns: controls.frozen.value,
      frozenRightColumns: controls.frozenRight.value,
      showRowHeaders: controls.rowHeaders.value,
      filterMode: grid.getFilterMode(),
      pagination: controls.pagination.checked,
      remote: controls.remote.checked,
      rowGroupMode: controls.groupRows
        ? controls.groupRows.value
        : DEFAULT_DEMO_SETTINGS.rowGroupMode,
      multiSelectRows: controls.multiSelect.checked,
      editMode: controls.editMode.checked,
    });
  }

  function saveDemoSettings(settings) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(
          DEMO_SETTINGS_KEY,
          JSON.stringify(normalizeDemoSettings(settings))
        );
      }
    } catch (error) {
      return;
    }
  }

  function applyDemoSettingsToControls(settings) {
    controls.language.value = settings.locale;
    controls.theme.value = settings.theme;
    controls.demoFilter.value = settings.searchText;
    controls.frozen.value = settings.frozenColumns;
    controls.frozenRight.value = settings.frozenRightColumns;
    controls.rowHeaders.value =
      settings.showRowHeaders === true
        ? "true"
        : settings.showRowHeaders === "cell"
        ? "cell"
        : "false";
    controls.filtering.checked = settings.filterMode !== false;
    controls.pagination.checked = settings.pagination;
    controls.remote.checked = settings.remote;
    if (controls.groupRows) {
      controls.groupRows.value = settings.rowGroupMode;
    }
    controls.multiSelect.checked = settings.multiSelectRows;
    controls.editMode.checked = settings.editMode;
  }

  function normalizeDemoSettings(settings) {
    settings = settings || {};
    return {
      locale: normalizeLocaleSetting(
        settings.locale,
        DEFAULT_DEMO_SETTINGS.locale
      ),
      theme: normalizeThemeSetting(settings.theme, DEFAULT_DEMO_SETTINGS.theme),
      searchText:
        settings.searchText == null
          ? DEFAULT_DEMO_SETTINGS.searchText
          : String(settings.searchText),
      frozenColumns: normalizeNumberSetting(
        settings.frozenColumns,
        DEFAULT_DEMO_SETTINGS.frozenColumns,
        0,
        6
      ),
      frozenRightColumns: normalizeNumberSetting(
        settings.frozenRightColumns,
        DEFAULT_DEMO_SETTINGS.frozenRightColumns,
        0,
        6
      ),
      showRowHeaders: normalizeRowHeaderSetting(
        settings.showRowHeaders,
        DEFAULT_DEMO_SETTINGS.showRowHeaders
      ),
      filterMode: normalizeFilterModeSetting(settings),
      pagination: normalizeBooleanSetting(
        settings.pagination,
        DEFAULT_DEMO_SETTINGS.pagination
      ),
      remote: normalizeBooleanSetting(
        settings.remote,
        DEFAULT_DEMO_SETTINGS.remote
      ),
      rowGroupMode: normalizeRowGroupModeSetting(
        settings.rowGroupMode,
        settings.showRowGroups,
        DEFAULT_DEMO_SETTINGS.rowGroupMode
      ),
      multiSelectRows: normalizeBooleanSetting(
        settings.multiSelectRows,
        DEFAULT_DEMO_SETTINGS.multiSelectRows
      ),
      editMode: normalizeBooleanSetting(
        settings.editMode,
        DEFAULT_DEMO_SETTINGS.editMode
      ),
    };
  }

  function normalizeFilterModeSetting(settings) {
    var value = settings.filterMode;
    var result = [];
    if (value === false || (value == null && settings.allowFiltering === false)) {
      return false;
    }
    if (!Array.isArray(value)) {
      value = settings.showSearchRow === true
        ? ["searchRow", "excel"]
        : DEFAULT_DEMO_SETTINGS.filterMode;
    }
    value.forEach(function (mode) {
      var normalized = String(mode || "").toLowerCase();
      if (normalized === "searchrow" || normalized === "search-row") {
        normalized = "searchRow";
      } else if (normalized === "excel") {
        normalized = "excel";
      } else {
        return;
      }
      if (result.indexOf(normalized) < 0) {
        result.push(normalized);
      }
    });
    return result.length ? result : false;
  }

  function normalizeNumberSetting(value, defaultValue, min, max) {
    value = Number(value);
    if (!isFinite(value)) {
      value = defaultValue;
    }
    value = Math.round(value);
    return Math.max(min, Math.min(max, value));
  }

  function normalizeBooleanSetting(value, defaultValue) {
    if (value === true || value === false) {
      return value;
    }
    return defaultValue;
  }

  function normalizeRowGroupModeSetting(value, legacyValue, defaultValue) {
    var text = value == null ? "" : String(value).toLowerCase();
    if (
      text === "none" ||
      text === "order" ||
      text === "vendor" ||
      text === "vendor-order"
    ) {
      return text;
    }
    if (legacyValue === false) {
      return "none";
    }
    if (legacyValue === true) {
      return "order";
    }
    return defaultValue;
  }

  function normalizeRowHeaderSetting(value, defaultValue) {
    var text;
    if (value === true || value === false || value === "cell") {
      return value;
    }
    text = value == null ? "" : String(value).toLowerCase();
    if (text === "true" || text === "number" || text === "row-number") {
      return true;
    }
    if (text === "cell" || text === "blank") {
      return "cell";
    }
    if (text === "false" || text === "none" || text === "off") {
      return false;
    }
    return defaultValue;
  }

  function normalizeLocaleSetting(value, defaultValue) {
    var text = value == null ? "" : String(value);
    return DEMO_LOCALES[text] ? text : defaultValue;
  }

  function normalizeThemeSetting(value, defaultValue) {
    var text = value == null ? "" : String(value);
    var i;
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      if (DEMO_THEMES[i].value === text) {
        return text;
      }
    }
    return defaultValue;
  }

  // ---------------------------------------------------------------------------
  // Theme, locale, and grouping helpers
  // ---------------------------------------------------------------------------

  function populateThemeOptions() {
    var fragment = document.createDocumentFragment();
    var option;
    var i;
    controls.theme.textContent = "";
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      option = document.createElement("option");
      option.value = DEMO_THEMES[i].value;
      option.textContent = DEMO_THEMES[i].label;
      fragment.appendChild(option);
    }
    controls.theme.appendChild(fragment);
  }

  function applyDemoTheme(theme) {
    var i;
    theme = normalizeThemeSetting(theme, DEFAULT_DEMO_SETTINGS.theme);
    controls.theme.value = theme;
    if (!grid || !grid.root) {
      return;
    }
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      grid.root.classList.remove("fg-theme-" + DEMO_THEMES[i].value);
    }
    grid.root.classList.add("fg-theme-" + theme);
    syncDemoFilterHeaderTextStyle();
  }

  function syncDemoFilterHeaderTextStyle() {
    var filterBar = document.querySelector(".demo-filter-bar");
    var headerCell =
      grid && grid.root ? grid.root.querySelector(".fg-header-cell") : null;
    var style;
    if (!filterBar || !headerCell) {
      return;
    }
    style = window.getComputedStyle(headerCell);
    filterBar.style.color = style.color;
    filterBar.style.fontFamily = style.fontFamily;
    filterBar.style.fontSize = style.fontSize;
    filterBar.style.fontWeight = style.fontWeight;
  }

  function getDemoText(key) {
    var pack = getDemoLocalePack(controls.language.value);
    return pack[key] || key;
  }

  function getDemoLocalePack(locale) {
    locale = normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale);
    return DEMO_LOCALES[locale] || DEMO_LOCALES[DEFAULT_DEMO_SETTINGS.locale];
  }

  function getWorkflowComboboxData(locale) {
    var labels = getDemoLocalePack(locale).workflowLabels;
    var items = [];
    var i;
    for (i = 0; i < DEMO_WORKFLOW_VALUES.length; i += 1) {
      items.push({ value: DEMO_WORKFLOW_VALUES[i], text: labels[i] });
    }
    return items;
  }

  function formatDemoText(text, data) {
    return String(text == null ? "" : text).replace(
      /\{([^}]+)\}/g,
      function (match, key) {
        return data && Object.prototype.hasOwnProperty.call(data, key)
          ? data[key]
          : match;
      }
    );
  }

  function formatDemoRowGroupHeader(args) {
    return formatDemoText(getDemoText("groupHeader"), {
      header: getDemoRowGroupHeaderText(args),
      key: args.key,
      count: args.count,
    });
  }

  function formatDemoVendorOrderRowGroupHeader(args) {
    return formatDemoText(getDemoText("groupVendorOrderHeader"), {
      header: getDemoRowGroupHeaderText(args),
      vendor: args.item.facno,
      order: args.item.dlvno,
      count: args.count,
    });
  }

  function getDemoRowGroupHeaderText(args) {
    var bindings =
      args.config &&
      (args.config.bindings ||
        args.config.binding ||
        args.config.fields ||
        args.config.field);
    var header;
    if (args.header) {
      return args.header;
    }
    if (bindings == null) {
      if (args.key === args.item.facno) {
        bindings = "facno";
      } else if (args.key === args.item.dlvno) {
        bindings = "dlvno";
      } else {
        bindings = ["facno", "dlvno"];
      }
    }
    if (!Array.isArray(bindings)) {
      bindings = [bindings];
    }
    header = bindings.map(getDemoColumnHeader).join(" + ");
    return header || getDemoText("groupRows");
  }

  function getDemoColumnHeader(binding) {
    var i;
    for (i = 0; i < columns.length; i += 1) {
      if (columns[i].binding === binding) {
        return columns[i].header;
      }
    }
    return String(binding);
  }

  function getDemoRowGroups(mode) {
    mode = normalizeRowGroupModeSetting(
      mode,
      null,
      DEFAULT_DEMO_SETTINGS.rowGroupMode
    );
    return DEMO_ROW_GROUPS[mode] ? DEMO_ROW_GROUPS[mode].slice() : [];
  }

  function refreshDemoRowGroups() {
    if (controls.groupRows) {
      grid.setRowGroups(getDemoRowGroups(controls.groupRows.value));
    }
  }

  function updateGroupRowsOptions() {
    var labelsByValue = {
      none: getDemoText("groupNone"),
      order: getDemoText("groupOrder"),
      vendor: getDemoText("groupVendor"),
      "vendor-order": getDemoText("groupVendorOrder"),
    };
    var i;
    var option;
    if (!controls.groupRows) {
      return;
    }
    for (i = 0; i < controls.groupRows.options.length; i += 1) {
      option = controls.groupRows.options[i];
      if (Object.prototype.hasOwnProperty.call(labelsByValue, option.value)) {
        option.textContent = labelsByValue[option.value];
      }
    }
  }

  function updateRowHeaderOptions() {
    var labelsByValue = {
      false: getDemoText("off"),
      true: getDemoText("rowNumber"),
      cell: getDemoText("cellOnly"),
    };
    var i;
    var option;
    for (i = 0; i < controls.rowHeaders.options.length; i += 1) {
      option = controls.rowHeaders.options[i];
      if (Object.prototype.hasOwnProperty.call(labelsByValue, option.value)) {
        option.textContent = labelsByValue[option.value];
      }
    }
  }

  function applyDemoLocale(locale) {
    locale = normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale);
    controls.language.value = locale;
    applyWorkflowComboboxData(columns, locale);
    applyLookupIconLocale(columns, locale);
    document.documentElement.lang = locale;
    labels.language.textContent = getDemoText("language");
    labels.theme.textContent = getDemoText("theme");
    labels.frozen.textContent = getDemoText("frozen");
    labels.frozenRight.textContent = getDemoText("frozenRight");
    labels.rowHeaders.textContent = getDemoText("rowHeaders");
    updateRowHeaderOptions();
    labels.filtering.textContent = getDemoText("filtering");
    labels.pagination.textContent = getDemoText("pagination");
    labels.remote.textContent = getDemoText("remote");
    if (labels.groupRows) {
      labels.groupRows.textContent = getDemoText("groupRows");
    }
    updateGroupRowsOptions();
    labels.multiSelect.textContent = getDemoText("multiSelect");
    labels.editMode.textContent = getDemoText("editMode");
    labels.exportCsv.textContent = toolbarIconOnly
      ? ""
      : getDemoText("exportCsv");
    labels.exportCsv.setAttribute("aria-label", getDemoText("exportCsv"));
    labels.exportCsv.setAttribute("title", getDemoText("exportCsv"));
    labels.exportExcel.textContent = toolbarIconOnly
      ? ""
      : getDemoText("exportExcel");
    labels.exportExcel.setAttribute("aria-label", getDemoText("exportExcel"));
    labels.exportExcel.setAttribute("title", getDemoText("exportExcel"));
    updateFullscreenButton();
    labels.demoFilter.textContent = getDemoText("filter");
    setDemoFilterPrompt(getDemoText("filterPlaceholder"));
    controls.demoFilterClear.setAttribute(
      "aria-label",
      getDemoText("clearFilter")
    );
    controls.demoFilterClear.setAttribute("title", getDemoText("clearFilter"));
    applyLookupPopupLocale(locale);
    updateDemoResultCount();
  }

  function applyGridColumnHeaderLocale(targetGrid, locale) {
    applyColumnHeaderLocale(columns, locale);
    applyColumnHeaderLocale(targetGrid.columns, locale);
    applyWorkflowComboboxData(targetGrid.columns, locale);
    applyLookupIconLocale(columns, locale);
    applyLookupIconLocale(targetGrid.columns, locale);
    if (targetGrid.root) {
      targetGrid.render();
    }
  }

  function applyWorkflowComboboxData(targetColumns, locale) {
    var data = getWorkflowComboboxData(
      normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale)
    );
    var column;
    var editor;
    var i;
    if (!targetColumns) {
      return;
    }
    for (i = 0; i < targetColumns.length; i += 1) {
      column = targetColumns[i];
      if (!column || column.binding !== "stus") {
        continue;
      }
      editor = column.editor;
      if (editor && editor.options) {
        editor.options.data = data;
      } else if (editor) {
        editor.data = data;
      }
    }
  }

  function applyLookupIconLocale(targetColumns, locale) {
    var column;
    var config;
    var icon;
    var i;
    var j;
    var k;
    var text = getDemoLocalePack(locale).openLookup;
    if (!targetColumns) {
      return;
    }
    for (i = 0; i < targetColumns.length; i += 1) {
      column = targetColumns[i];
      if (!column || column.binding !== "cusno") {
        continue;
      }
      for (j = 0; j < 2; j += 1) {
        config = j === 0 ? column.search : column.editor;
        if (!config || !Array.isArray(config.icons)) {
          continue;
        }
        for (k = 0; k < config.icons.length; k += 1) {
          icon = config.icons[k];
          if (icon && icon.iconCls === "icon-refwin") {
            icon.title = text;
            icon.ariaLabel = text;
          }
        }
      }
    }
  }

  function applyColumnHeaderLocale(targetColumns, locale) {
    var i;
    var column;
    if (!targetColumns) {
      return;
    }
    for (i = 0; i < targetColumns.length; i += 1) {
      column = targetColumns[i];
      column.header = getColumnHeaderText(column, locale);
    }
  }

  function getColumnHeaderText(column, locale) {
    var headers = getDemoLocalePack(locale).columnHeaders || {};
    var binding = column && column.binding ? String(column.binding) : "";
    var index;
    if (Object.prototype.hasOwnProperty.call(headers, binding)) {
      return headers[binding];
    }
    index = getColumnNumberFromBinding(binding);
    if (index != null) {
      return formatDemoText(headers.defaultColumn || "Column {index}", {
        index: index,
      });
    }
    return column && column.header ? column.header : binding;
  }

  function getColumnNumberFromBinding(binding) {
    var match = String(binding || "").match(/^col0*(\d+)$/);
    return match ? Number(match[1]) : null;
  }

  // ---------------------------------------------------------------------------
  // Runtime statistics, data mode, and filtering
  // ---------------------------------------------------------------------------

  function updateDatasetSummary() {
    if (stats.datasetSummary) {
      stats.datasetSummary.textContent = rows.length + " x " + columns.length;
    }
  }

  function refreshViewportStats() {
    updateViewportStats({
      totalRows: grid.view.length,
      rowStart: grid.rowRange.start,
      rowEnd: grid.rowRange.end,
      columnStart: grid.columnRange.start,
      columnEnd: grid.columnRange.end,
      renderedCells: grid.root.querySelectorAll(".fg-cell").length,
    });
  }

  function updateViewportStats(e) {
    stats.rowCount.textContent =
      getDemoText("rows") + ": " + e.totalRows + " / " + rows.length;
    stats.rowRange.textContent =
      getDemoText("rowsVisible") +
      ": " +
      e.rowStart +
      "-" +
      Math.max(e.rowStart, e.rowEnd - 1);
    stats.columnRange.textContent =
      getDemoText("columnsVisible") +
      ": " +
      e.columnStart +
      "-" +
      Math.max(e.columnStart, e.columnEnd - 1) +
      " / " +
      columns.length;
    stats.cellCount.textContent =
      getDemoText("renderedCells") + ": " + e.renderedCells;
    updateDemoResultCount();
  }

  function updateDemoResultCount() {
    var total;
    if (!grid || !grid.options) {
      if (labels.demoResultCount) {
        labels.demoResultCount.textContent = getDemoText("resultCount") + ": -";
      }
      return;
    }
    total =
      grid.options.pagination || grid.options.remote === true
        ? grid.paginationTotal
        : grid.dataView.length;
    if (labels.demoResultCount) {
      labels.demoResultCount.textContent =
        getDemoText("resultCount") + ": " + formatDemoNumber(total);
    }
  }

  function initializeDemoFilterTextBox() {
    if (!controls.demoFilter) return;
    controls.demoFilter.setAttribute(
      "placeholder",
      getDemoText("filterPlaceholder")
    );
    updateDemoFilterModeIcon();
  }

  function applyDemoDataMode() {
    var useRemote = controls.remote.checked;
    if (useRemote) {
      grid.clearFilter();
    }
    grid.options.pagination = controls.pagination.checked;
    grid.options.remote = useRemote;
    grid.options.pageNumber = 1;
    if (grid.options.pager) {
      grid.options.pager.pageNumber = 1;
    }
    updateDemoFilterAvailability(useRemote);
    if (useRemote) {
      grid.setItemsSource([], true);
      grid.load();
      return;
    }
    grid.setItemsSource(rows);
    updateDemoResultCount();
  }

  function updateDemoFilterAvailability(useRemote) {
    var disabled = useRemote === true;
    controls.demoFilter.disabled = disabled;
    controls.demoFilterMode.disabled = disabled;
    controls.demoFilterClear.disabled = disabled;
    if (disabled) {
      setDemoFilterValue("");
    }
  }

  function setDemoFilterValue(value) {
    if (controls.demoFilter) controls.demoFilter.value = value;
  }

  function getDemoFilterValue() {
    return controls.demoFilter ? controls.demoFilter.value : "";
  }

  function applyDemoFilter(value) {
    var terms = String(value == null ? "" : value)
      .split(",")
      .map(function (term) {
        return term.trim().toLowerCase();
      })
      .filter(function (term) {
        return term !== "";
      });
    if (!terms.length) {
      grid.setFilter(null);
      return;
    }
    grid.setFilter(function (item) {
      return terms[demoFilterMode === "and" ? "every" : "some"](function (
        term
      ) {
        return columns.some(function (column) {
          var actual = getDemoFilterBindingValue(item, column.binding);
          return (
            String(actual == null ? "" : actual)
              .toLowerCase()
              .indexOf(term) >= 0
          );
        });
      });
    });
  }

  function toggleDemoFilterMode() {
    demoFilterMode = demoFilterMode === "and" ? "or" : "and";
    updateDemoFilterModeIcon();
    applyDemoFilter(getDemoFilterValue());
    saveCurrentDemoSettings();
  }

  function updateDemoFilterModeIcon() {
    var label = demoFilterMode === "and" ? "&" : "OR";
    if (!controls.demoFilterMode) return;
    controls.demoFilterMode.textContent = label;
    controls.demoFilterMode.classList.toggle(
      "demo-filter-mode-and",
      demoFilterMode === "and"
    );
    controls.demoFilterMode.setAttribute("aria-label", label);
    controls.demoFilterMode.setAttribute("title", label);
  }

  function getDemoFilterBindingValue(item, binding) {
    var parts = String(binding || "").split(".");
    var value = item;
    var i;
    for (i = 0; i < parts.length; i += 1) {
      if (value == null) {
        return "";
      }
      value = value[parts[i]];
    }
    return value;
  }

  function formatDemoNumber(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) {
      return String(value);
    }
    return number.toLocaleString(
      controls.language.value === "en" ? "en-US" : controls.language.value
    );
  }

  function setDemoFilterPrompt(prompt) {
    if (controls.demoFilter)
      controls.demoFilter.setAttribute("placeholder", prompt);
  }

  function focusDemoFilter() {
    if (controls.demoFilter) controls.demoFilter.focus();
  }

  initializeDemo();
})();
