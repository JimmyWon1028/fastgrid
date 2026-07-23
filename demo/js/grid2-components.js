var GRID2_THEMES = [
  { value: "default", text: "Default" },
  { value: "bootstrap", text: "Bootstrap" },
  { value: "cupertino", text: "Cupertino" },
  { value: "material", text: "Material" },
  { value: "material-blue", text: "Material Blue" },
  { value: "material-teal", text: "Material Teal" },
  { value: "metro", text: "Metro" },
  { value: "metro-blue", text: "Metro Blue" },
  { value: "metro-gray", text: "Metro Gray" },
  { value: "metro-green", text: "Metro Green" },
  { value: "metro-orange", text: "Metro Orange" },
  { value: "metro-red", text: "Metro Red" },
  { value: "sunny", text: "Sunny" },
  { value: "pepper-grinder", text: "Pepper Grinder" },
  { value: "dark-hive", text: "Dark Hive" },
  { value: "black", text: "Black" },
  { value: "mono", text: "Mono" },
  { value: "mono-red", text: "Mono Red" },
  { value: "mono-green", text: "Mono Green" },
];

function findPropertyDescriptor(element, name) {
  var target = element;
  var descriptor;
  while (target && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(target, name);
    target = Object.getPrototypeOf(target);
  }
  return descriptor || null;
}

function installValueBridge(element, state) {
  var descriptor = findPropertyDescriptor(element, "value");
  if (!descriptor || !descriptor.get || !descriptor.set) return;
  Object.defineProperty(element, "value", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: function () {
      return descriptor.get.call(element);
    },
    set: function (value) {
      descriptor.set.call(element, value);
      if (!state.component || state.syncingValue) return;
      state.pendingValue = descriptor.get.call(element);
      if (state.valueScheduled) return;
      state.valueScheduled = true;
      window.queueMicrotask(function () {
        state.valueScheduled = false;
        if (!state.component) return;
        state.syncingValue = true;
        state.component.setValue(state.pendingValue, true);
        state.syncingValue = false;
      });
    },
  });
}

function installDisabledBridge(element, state) {
  var descriptor = findPropertyDescriptor(element, "disabled");
  if (!descriptor || !descriptor.get || !descriptor.set) {
    Object.defineProperty(element, "disabled", {
      configurable: true,
      enumerable: true,
      get: function () {
        return state.component
          ? state.component.options.disabled === true
          : element.hasAttribute("disabled");
      },
      set: function (value) {
        if (!state.component || state.syncingDisabled) {
          if (value) element.setAttribute("disabled", "disabled");
          else element.removeAttribute("disabled");
          return;
        }
        state.syncingDisabled = true;
        if (value) state.component.disable();
        else state.component.enable();
        state.syncingDisabled = false;
      },
    });
    return;
  }
  Object.defineProperty(element, "disabled", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: function () {
      return descriptor.get.call(element);
    },
    set: function (value) {
      descriptor.set.call(element, value);
      if (!state.component || state.syncingDisabled) return;
      state.syncingDisabled = true;
      if (value) state.component.disable();
      else state.component.enable();
      state.syncingDisabled = false;
    },
  });
}

function installCheckedBridge(element, state) {
  var descriptor = findPropertyDescriptor(element, "checked");
  if (!descriptor || !descriptor.get || !descriptor.set) return;
  Object.defineProperty(element, "checked", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: function () {
      return descriptor.get.call(element);
    },
    set: function (value) {
      descriptor.set.call(element, value);
      if (
        !state.component ||
        state.syncingChecked ||
        state.component._changing
      ) {
        return;
      }
      state.syncingChecked = true;
      state.component.setOptions({ checked: Boolean(value) });
      state.syncingChecked = false;
    },
  });
}

function installButtonTextBridge(element, state) {
  var descriptor = findPropertyDescriptor(element, "textContent");
  if (!descriptor || !descriptor.get || !descriptor.set) return;
  Object.defineProperty(element, "textContent", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: function () {
      return descriptor.get.call(element);
    },
    set: function (value) {
      if (state.component && !state.syncingText) {
        state.syncingText = true;
        state.component.setText(value == null ? "" : String(value));
        state.syncingText = false;
        return;
      }
      descriptor.set.call(element, value);
    },
  });
}

function installCheckBoxLabelBridge(element, state) {
  var descriptor = findPropertyDescriptor(element, "textContent");
  if (!descriptor || !descriptor.get || !descriptor.set) return;
  Object.defineProperty(element, "textContent", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: function () {
      return descriptor.get.call(element);
    },
    set: function (value) {
      if (state.component && !state.syncingLabel) {
        state.syncingLabel = true;
        state.component.setLabel(value == null ? "" : String(value));
        state.syncingLabel = false;
        return;
      }
      descriptor.set.call(element, value);
    },
  });
}

function dispatchControlEvent(element, name) {
  element.dispatchEvent(new Event(name, { bubbles: true }));
}

export function bridgeNumberEditBoxInput(element, control, eventName) {
  var textbox;
  if (
    !element ||
    !control ||
    eventName !== "input" ||
    typeof control.getEditorType !== "function" ||
    control.getEditorType() !== "number" ||
    typeof control.textbox !== "function"
  ) {
    return false;
  }
  textbox = control.textbox();
  if (!textbox || typeof textbox.addEventListener !== "function") {
    return false;
  }
  textbox.addEventListener("input", function () {
    dispatchControlEvent(element, eventName);
  });
  return true;
}

function getSelectData(select) {
  return Array.prototype.map.call(select.options, function (option) {
    return {
      value: option.value,
      text: option.textContent,
      disabled: option.disabled,
      selected: option.selected,
    };
  });
}

function populateThemeSelect() {
  var select = document.getElementById("themeInput");
  var fragment;
  if (!select || select.options.length) return;
  fragment = document.createDocumentFragment();
  GRID2_THEMES.forEach(function (theme) {
    var option = document.createElement("option");
    option.value = theme.value;
    option.textContent = theme.text;
    fragment.appendChild(option);
  });
  select.appendChild(fragment);
}

export function createGrid2FabuiDemo(fabui) {
  var toolbarIconOnly =
    document.body.getAttribute("data-grid-toolbar-icon-only") === "true";
  var themeNames = GRID2_THEMES.map(function (theme) {
    return theme.value;
  });
  var editBoxes = {};
  var buttons = {};
  var checkBoxes = {};
  var lookupWindow = null;
  var lookupObserver = null;
  var componentStates = [];

  if (
    !fabui ||
    !fabui.EditBox ||
    !fabui.Button ||
    !fabui.CheckBox ||
    !fabui.Window
  ) {
    throw new Error(
      "FabGrid Demo requires FabUI EditBox, Button, CheckBox, and Window."
    );
  }

  populateThemeSelect();

  function createEditBox(id, options, eventName) {
    var element = document.getElementById(id);
    var state = {
      component: null,
      pendingValue: "",
      syncingValue: false,
      syncingDisabled: false,
      valueScheduled: false,
    };
    var selectObserver;
    var control;
    var originalOnChange = options.onChange;
    if (!element) return null;
    installValueBridge(element, state);
    installDisabledBridge(element, state);
    options.onChange = function (value, oldValue) {
      if (typeof originalOnChange === "function") {
        originalOnChange(value, oldValue);
      }
      dispatchControlEvent(element, eventName);
    };
    control = new fabui.EditBox(element, options);
    state.component = control;
    bridgeNumberEditBoxInput(element, control, eventName);
    componentStates.push(state);
    editBoxes[id] = control;

    if (element.tagName === "SELECT") {
      selectObserver = new MutationObserver(function () {
        var value = element.value;
        window.queueMicrotask(function () {
          if (!state.component) return;
          state.syncingValue = true;
          state.component.loadData(getSelectData(element), true);
          state.component.setValue(value, true);
          state.syncingValue = false;
        });
      });
      selectObserver.observe(element, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
    return control;
  }

  function createButton(elementOrId, options) {
    var element =
      typeof elementOrId === "string"
        ? document.getElementById(elementOrId)
        : elementOrId;
    var state = {
      component: null,
      syncingDisabled: false,
      syncingText: false,
    };
    var control;
    if (!element) return null;
    installButtonTextBridge(element, state);
    installDisabledBridge(element, state);
    if (options.iconCls) element.classList.remove(options.iconCls);
    control = new fabui.Button(element, options);
    state.component = control;
    componentStates.push(state);
    if (element.id) buttons[element.id] = control;
    return control;
  }

  function createCheckBox(id, labelId) {
    var element = document.getElementById(id);
    var label = document.getElementById(labelId);
    var container;
    var replacement;
    var labelText;
    var state = {
      component: null,
      syncingChecked: false,
      syncingDisabled: false,
      syncingLabel: false,
    };
    var control;
    if (!element || !label) return null;
    container = element.parentElement;
    if (container && container.tagName === "LABEL") {
      replacement = document.createElement("span");
      replacement.className = container.className;
      container.parentNode.insertBefore(replacement, container);
      while (container.firstChild) {
        replacement.appendChild(container.firstChild);
      }
      container.remove();
    }
    labelText = label.textContent;
    label.remove();
    installCheckedBridge(element, state);
    installDisabledBridge(element, state);
    control = new fabui.CheckBox(element, {
      width: 16,
      height: 16,
      checked: element.checked,
      label: labelText,
      labelPosition: "after",
      theme: "inherit",
    });
    control.labelElement.id = labelId;
    state.component = control;
    installCheckBoxLabelBridge(control.labelElement, state);
    componentStates.push(state);
    checkBoxes[id] = control;
    return control;
  }

  function syncTheme(theme) {
    theme = themeNames.indexOf(theme) >= 0 ? theme : "default";
    themeNames.forEach(function (name) {
      document.body.classList.remove("fg-theme-" + name);
    });
    document.body.classList.add("fg-theme-" + theme);
    Object.keys(buttons).forEach(function (key) {
      buttons[key].setTheme("inherit");
    });
    Object.keys(checkBoxes).forEach(function (key) {
      checkBoxes[key].setTheme("inherit");
    });
    if (lookupWindow) lookupWindow.setTheme(theme);
  }

  createEditBox(
    "languageInput",
    {
      editor: "combo",
      editable: false,
      width: 108,
      height: 34,
      panelHeight: "auto",
    },
    "change"
  );
  createEditBox(
    "themeInput",
    {
      editor: "combo",
      editable: false,
      width: 148,
      height: 34,
      panelHeight: 360,
      onChange: function (value) {
        window.queueMicrotask(function () {
          syncTheme(value);
        });
      },
    },
    "change"
  );
  createEditBox(
    "frozenInput",
    {
      editor: "number",
      min: 0,
      max: 6,
      precision: 0,
      spinner: true,
      width: 58,
      height: 34,
    },
    "input"
  );
  createEditBox(
    "frozenRightInput",
    {
      editor: "number",
      min: 0,
      max: 6,
      precision: 0,
      spinner: true,
      width: 58,
      height: 34,
    },
    "input"
  );
  createEditBox(
    "rowHeadersInput",
    {
      editor: "combo",
      editable: false,
      width: 140,
      height: 34,
      panelHeight: "auto",
    },
    "change"
  );
  createEditBox(
    "groupRowsInput",
    {
      editor: "combo",
      editable: false,
      width: 190,
      height: 34,
      panelHeight: "auto",
    },
    "change"
  );
  createEditBox(
    "demoFilterInput",
    {
      editor: "text",
      width: "100%",
      height: 30,
    },
    "input"
  );

  document
    .querySelector(".demo-filter-input-wrap")
    .classList.add("demo-filter-textbox-ready");

  createButton("exportButton", {
    width: toolbarIconOnly ? 34 : null,
    height: 34,
    iconCls: "icon-export",
    text: "",
    cls: "grid2-toolbar-button",
  });
  createButton("exportExcelButton", {
    width: toolbarIconOnly ? 34 : null,
    height: 34,
    iconCls: "icon-excel",
    text: "",
    cls: "grid2-toolbar-button",
  });
  createButton("fullscreenButton", {
    width: toolbarIconOnly ? 34 : null,
    height: 34,
    iconCls: "icon-fullscreen",
    text: "",
    toggle: true,
    cls: "grid2-toolbar-button",
  });
  createButton("demoFilterMode", {
    width: 42,
    height: 30,
    text: "OR",
    plain: true,
  });
  createButton("demoFilterClear", {
    width: 34,
    height: 30,
    iconCls: "",
    text: "🧹",
    plain: true,
  });
  createCheckBox("searchRowInput", "searchRowLabel");
  createCheckBox("paginationInput", "paginationLabel");
  createCheckBox("remoteInput", "remoteLabel");
  createCheckBox("multiSelectInput", "multiSelectLabel");
  createCheckBox("editModeInput", "editModeLabel");
  createCheckBox("selectionRangeInput", "selectionRangeLabel");

  function syncFullscreenState() {
    var element = document.getElementById("fullscreenButton");
    var button = buttons.fullscreenButton;
    if (!element || !button) return;
    if (element.getAttribute("aria-pressed") === "true") button.select(true);
    else button.unselect(true);
  }

  new MutationObserver(syncFullscreenState).observe(
    document.getElementById("fullscreenButton"),
    { attributes: true, attributeFilter: ["aria-pressed"] }
  );

  function upgradeLookupPopup(overlay) {
    var host = overlay.querySelector(".lookup-popup-window");
    var customHeader = overlay.querySelector(".lookup-popup-header");
    var title = overlay.querySelector(".lookup-popup-title");
    var closeButton = overlay.querySelector(".lookup-popup-icon-button");
    var footer = overlay.querySelector(".lookup-popup-footer");
    var pager = overlay.querySelector(".lookup-popup-pager");
    var visibilityObserver;
    var titleObserver;
    var layoutRefreshTimer = 0;
    if (!host || !title || !footer || host.__grid2WindowReady) return;
    host.__grid2WindowReady = true;
    overlay.classList.add("grid2-window-ready");
    if (customHeader) customHeader.hidden = true;

    createButton(overlay.querySelector(".lookup-popup-button.icon-clear"), {
      height: 30,
      iconCls: "icon-clear",
      text: overlay.querySelector(".lookup-popup-button.icon-clear")
        .textContent,
    });
    createButton(overlay.querySelector(".lookup-popup-button.icon-remove"), {
      height: 30,
      iconCls: "icon-remove",
      text: overlay.querySelector(".lookup-popup-button.icon-remove")
        .textContent,
    });
    createButton(overlay.querySelector(".lookup-popup-button.icon-check"), {
      height: 30,
      iconCls: "icon-check",
      text: overlay.querySelector(".lookup-popup-button.icon-check")
        .textContent,
    });

    if (pager) {
      Array.prototype.forEach.call(
        pager.querySelectorAll("span:not(.lookup-popup-count)"),
        function (item) {
          item.hidden = true;
        }
      );
    }

    function refreshLookupGridLayout() {
      function invalidateLookupGrid() {
        var grid = fabui.Control.getControl(host.querySelector(".lookup-popup-grid"));
        if (grid && typeof grid.invalidate === "function") grid.invalidate();
      }
      window.requestAnimationFrame(function () {
        invalidateLookupGrid();
      });
      window.clearTimeout(layoutRefreshTimer);
      layoutRefreshTimer = window.setTimeout(function () {
        layoutRefreshTimer = 0;
        invalidateLookupGrid();
      }, 240);
    }

    lookupWindow = new fabui.Window(host, {
      title: title.textContent,
      width: Math.min(760, Math.max(320, window.innerWidth - 36)),
      height: Math.min(455, Math.max(260, window.innerHeight - 36)),
      fixed: true,
      constrain: true,
      modal: false,
      maximizable: true,
      minimizable: false,
      collapsible: false,
      closable: true,
      closed: overlay.style.display !== "flex",
      footer: footer,
      locale: document.getElementById("languageInput").value,
      theme: document.getElementById("themeInput").value,
      onClose: function () {
        if (overlay.style.display !== "none" && closeButton) {
          closeButton.click();
        } else {
          overlay.style.display = "none";
        }
      },
      onOpen: refreshLookupGridLayout,
      onResize: refreshLookupGridLayout,
      onMaximize: refreshLookupGridLayout,
      onRestore: refreshLookupGridLayout,
    });
    lookupWindow.center();

    function syncLookupVisibility() {
      var visible = overlay.style.display === "flex";
      if (visible && !lookupWindow.isOpen()) {
        lookupWindow.open(true).center();
      } else if (!visible && lookupWindow.isOpen()) {
        lookupWindow.close(true);
      }
    }

    visibilityObserver = new MutationObserver(syncLookupVisibility);
    visibilityObserver.observe(overlay, {
      attributes: true,
      attributeFilter: ["style"],
    });

    titleObserver = new MutationObserver(function () {
      lookupWindow.setTitle(title.textContent);
      lookupWindow.setLocale(document.getElementById("languageInput").value);
    });
    titleObserver.observe(title, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  lookupObserver = new MutationObserver(function () {
    var overlay = document.querySelector(".lookup-popup-overlay");
    if (!overlay) return;
    upgradeLookupPopup(overlay);
    lookupObserver.disconnect();
  });
  lookupObserver.observe(document.body, { childList: true });

  return {
    complete: function () {
      var theme = document.getElementById("themeInput").value;
      Object.keys(editBoxes).forEach(function (key) {
        var source = document.getElementById(key);
        editBoxes[key].setValue(source.value, true);
      });
      syncTheme(theme);
      syncFullscreenState();
      if (window.fabGridDemo) {
        window.fabGridDemo.fabuiComponents = {
          editBoxes: editBoxes,
          buttons: buttons,
          checkBoxes: checkBoxes,
          get lookupWindow() {
            return lookupWindow;
          },
        };
      }
    },
  };
}
