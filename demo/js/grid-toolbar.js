// Shared Grid demo toolbar.
(function (global) {
  "use strict";

  var TOOLBAR_MARKUP = [
    '<div class="brand">',
    '  <h1 id="demoToolbarTitle">FabGrid</h1>',
    '  <p><span id="demoToolbarDescription">Pure JS performance-first grid</span> · <span id="datasetSummary">-</span></p>',
    "</div>",
    '<label class="field compact">',
    '  <span id="languageLabel">語言</span>',
    '  <select id="languageInput">',
    '    <option value="zh-TW">繁體中文</option>',
    '    <option value="zh-CN">简体中文</option>',
    '    <option value="en">English</option>',
    "  </select>",
    "</label>",
    '<label class="field compact theme-field">',
    '  <span id="themeLabel">主題</span>',
    '  <select id="themeInput"></select>',
    "</label>",
    '<label class="field compact narrow-number-field">',
    '  <span id="frozenLabel">凍結欄</span>',
    '  <input id="frozenInput" type="number" min="0" max="6" value="2">',
    "</label>",
    '<label class="field compact narrow-number-field">',
    '  <span id="frozenRightLabel">右凍結欄</span>',
    '  <input id="frozenRightInput" type="number" min="0" max="6" value="1">',
    "</label>",
    '<label class="field compact">',
    '  <span id="rowHeadersLabel">列號</span>',
    '  <select id="rowHeadersInput">',
    '    <option value="false">關閉</option>',
    '    <option value="true">顯示列號</option>',
    '    <option value="cell">只顯示 cell</option>',
    "  </select>",
    "</label>",
    '<label class="field compact">',
    '  <span id="groupRowsLabel">群組</span>',
    '  <select id="groupRowsInput">',
    '    <option value="none">沒有群組</option>',
    '    <option value="order">訂單編號</option>',
    '    <option value="vendor">主要廠商 + 訂單編號</option>',
    '    <option value="vendor-order">主要廠商 &gt; 訂單編號</option>',
    "  </select>",
    "</label>",
    '<label class="toggle">',
    '  <input id="searchRowInput" type="checkbox">',
    '  <span id="searchRowLabel">篩選</span>',
    "</label>",
    '<label class="toggle">',
    '  <input id="paginationInput" type="checkbox">',
    '  <span id="paginationLabel">分頁</span>',
    "</label>",
    '<label class="toggle">',
    '  <input id="remoteInput" type="checkbox">',
    '  <span id="remoteLabel">遠端</span>',
    "</label>",
    '<label class="toggle">',
    '  <input id="multiSelectInput" type="checkbox">',
    '  <span id="multiSelectLabel">多選</span>',
    "</label>",
    '<label class="toggle">',
    '  <input id="editModeInput" type="checkbox">',
    '  <span id="editModeLabel">編輯</span>',
    "</label>",
    '<a id="exportButton" class="toolbar-icon-button icon-export" data-icon-cls="icon-export" href="javascript:void(0)"></a>',
    '<a id="exportExcelButton" class="toolbar-icon-button icon-excel" data-icon-cls="icon-excel" href="javascript:void(0)"></a>',
    '<a id="fullscreenButton" class="toolbar-icon-button icon-fullscreen" data-icon-cls="icon-fullscreen" href="javascript:void(0)" aria-pressed="false"></a>',
  ].join("");
  var SELECTION_RANGE_MARKUP = [
    '<label class="toggle">',
    '  <input id="selectionRangeInput" type="checkbox">',
    '  <span id="selectionRangeLabel">選範圍</span>',
    "</label>",
  ].join("");

  function render(host) {
    var multiSelectControl;
    if (!host || host.getAttribute("data-demo-toolbar-ready") === "true")
      return host;
    host.classList.add("toolbar");
    host.setAttribute("aria-label", "FabGrid controls");
    host.innerHTML = TOOLBAR_MARKUP;
    if (host.getAttribute("data-selection-range-toggle") === "true") {
      multiSelectControl = host.querySelector("#multiSelectInput");
      if (multiSelectControl && multiSelectControl.parentElement) {
        multiSelectControl.parentElement.insertAdjacentHTML(
          "afterend",
          SELECTION_RANGE_MARKUP
        );
      }
    }
    setText(host, "demoToolbarTitle", host.getAttribute("data-toolbar-title"));
    setText(
      host,
      "demoToolbarDescription",
      host.getAttribute("data-toolbar-description")
    );
    host.setAttribute("data-demo-toolbar-ready", "true");
    return host;
  }

  function renderAll(root) {
    var hosts = (root || document).querySelectorAll(
      "[data-fabgrid-demo-toolbar]"
    );
    var index;
    for (index = 0; index < hosts.length; index += 1) render(hosts[index]);
  }

  function update(host, options) {
    var values;
    var text;
    var controls;
    var index;
    host = render(host);
    if (!host) return;
    options = options || {};
    values = options.values || {};
    text = options.text || {};

    setText(host, "datasetSummary", options.datasetSummary);
    setText(host, "languageLabel", text.language);
    setText(host, "themeLabel", text.theme);
    setText(host, "frozenLabel", text.frozen);
    setText(host, "frozenRightLabel", text.frozenRight);
    setText(host, "rowHeadersLabel", text.rowHeaders);
    setText(host, "groupRowsLabel", text.groupRows);
    setText(host, "searchRowLabel", text.searchRow);
    setText(host, "paginationLabel", text.pagination);
    setText(host, "remoteLabel", text.remote);
    setText(host, "multiSelectLabel", text.multiSelect);
    setText(host, "editModeLabel", text.editMode);
    setText(host, "selectionRangeLabel", text.selectionRange);
    setOptionText(host, "rowHeadersInput", "false", text.off);
    setOptionText(host, "rowHeadersInput", "true", text.rowNumber);
    setOptionText(host, "rowHeadersInput", "cell", text.cellOnly);
    setOptionText(host, "groupRowsInput", "none", text.groupNone);
    setOptionText(host, "groupRowsInput", "order", text.groupOrder);
    setOptionText(host, "groupRowsInput", "vendor", text.groupVendor);
    setOptionText(
      host,
      "groupRowsInput",
      "vendor-order",
      text.groupVendorOrder
    );
    setButtonText(host, "exportButton", text.exportCsv);
    setButtonText(host, "exportExcelButton", text.exportExcel);
    updateThemes(host, options.themes || []);

    setValue(host, "languageInput", values.locale);
    setValue(host, "themeInput", values.theme);
    setValue(host, "frozenInput", values.frozenColumns);
    setValue(host, "frozenRightInput", values.frozenRightColumns);
    setValue(host, "rowHeadersInput", values.showRowHeaders);
    setValue(host, "groupRowsInput", values.rowGroupMode);
    setChecked(
      host,
      "searchRowInput",
      Array.isArray(values.filterMode) || values.allowFiltering === true
    );
    setChecked(host, "paginationInput", values.pagination);
    setChecked(host, "remoteInput", values.remote);
    setChecked(host, "multiSelectInput", values.multiSelectRows);
    setChecked(host, "editModeInput", values.editMode);
    setChecked(
      host,
      "selectionRangeInput",
      values.selectionMode === "CellRange"
    );

    controls = host.querySelectorAll("input, select, button");
    for (index = 0; index < controls.length; index += 1) {
      controls[index].disabled = options.busy === true;
    }
    updateFullscreenButton(host, options, text);
  }

  function updateThemes(host, themes) {
    var select = find(host, "themeInput");
    var signature = themes
      .map(function (item) {
        return item.value + ":" + item.label;
      })
      .join("|");
    var fragment;
    var index;
    var option;
    if (!select || select.getAttribute("data-theme-signature") === signature)
      return;
    fragment = document.createDocumentFragment();
    for (index = 0; index < themes.length; index += 1) {
      option = document.createElement("option");
      option.value = themes[index].value;
      option.textContent = themes[index].label;
      fragment.appendChild(option);
    }
    select.innerHTML = "";
    select.appendChild(fragment);
    select.setAttribute("data-theme-signature", signature);
  }

  function updateFullscreenButton(host, options, text) {
    var button = find(host, "fullscreenButton");
    var active = options.fullscreenActive === true;
    var available = options.fullscreenAvailable !== false;
    var label = available
      ? active
        ? text.exitFullscreen
        : text.fullscreen
      : text.fullscreenUnavailable;
    if (!button) return;
    button.disabled = options.busy === true || !available;
    button.setAttribute("aria-pressed", active ? "true" : "false");
    setButtonText(host, "fullscreenButton", label);
  }

  function setText(host, id, value) {
    var element = find(host, id);
    if (element && value != null) element.textContent = value;
  }

  function setButtonText(host, id, value) {
    var button = find(host, id);
    if (!button || value == null) return;
    button.setAttribute("aria-label", value);
    button.setAttribute("title", value);
  }

  function setOptionText(host, selectId, value, text) {
    var select = find(host, selectId);
    var option;
    if (!select || text == null) return;
    option = select.querySelector('option[value="' + value + '"]');
    if (option) option.textContent = text;
  }

  function setValue(host, id, value) {
    var control = find(host, id);
    if (control && value != null) control.value = String(value);
  }

  function setChecked(host, id, value) {
    var control = find(host, id);
    if (control) control.checked = value === true;
  }

  function find(host, id) {
    return host ? host.querySelector("#" + id) : null;
  }

  global.FabGridDemoToolbar = {
    render: render,
    renderAll: renderAll,
    update: update,
  };

  if (global.document) renderAll(global.document);
})(window);
