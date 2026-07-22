<template>
  <main class="grid-grid-page" data-demo-adapter="vue2">
    <header class="grid-grid-header">
      <div>
        <h1>FabGrid Grid + Grid 拖曳</h1>
        <p>Vue 2：左右兩側都是一般 Grid，可在各自 Grid 內上下重排，也可拖曳到另一個 Grid。</p>
      </div>
      <div class="grid-grid-actions">
        <button
          type="button"
          :class="{ 'grid-grid-drag-toggle-active': draggingEnabled }"
          :aria-pressed="draggingEnabled ? 'true' : 'false'"
          @click="toggleDragging"
        >
          {{ draggingEnabled ? "關閉拖曳" : "開啟拖曳" }}
        </button>
        <button type="button" @click="resetData">重設資料</button>
      </div>
    </header>

    <section class="grid-grid-layout">
      <article class="grid-grid-panel">
        <div class="grid-grid-panel-header">
          <div>
            <h2>待辦工作</h2>
            <p>拖曳資料列調整優先順序，或移到右側。</p>
          </div>
          <span class="grid-grid-count">{{ leftRows.length }} 筆</span>
        </div>
        <fab-grid
          ref="leftGrid"
          class="grid-grid-control"
          :items-source="leftRows"
          :columns="columns"
          :grid-options="gridOptions"
          :allow-dragging="draggingMode"
          @dragged-row="handleDraggedRow"
        ></fab-grid>
      </article>

      <article class="grid-grid-panel">
        <div class="grid-grid-panel-header">
          <div>
            <h2>進行中</h2>
            <p>拖曳資料列調整執行順序，或移回左側。</p>
          </div>
          <span class="grid-grid-count">{{ rightRows.length }} 筆</span>
        </div>
        <fab-grid
          ref="rightGrid"
          class="grid-grid-control"
          :items-source="rightRows"
          :columns="columns"
          :grid-options="gridOptions"
          :allow-dragging="draggingMode"
          @dragged-row="handleDraggedRow"
        ></fab-grid>
      </article>
    </section>

    <footer class="grid-grid-footer">
      <div class="grid-grid-drop-help" aria-label="Grid 拖曳落點說明">
        <span><i class="drop-before"></i>資料列上半部：放在之前</span>
        <span><i class="drop-after"></i>資料列下半部：放在之後</span>
      </div>
      <div class="grid-grid-status" aria-live="polite">{{ statusText }}</div>
    </footer>
  </main>
</template>

<script>
import "./grid-grid-data.js?v=20260715-grid-grid-vue2-v2";

function createColumns() {
  return [
    { binding: "name", header: "工作項目", width: 150, minWidth: 110 },
    { binding: "taskId", header: "編號", width: 96, minWidth: 82 },
    { binding: "owner", header: "負責人", width: 88, minWidth: 76 },
    {
      binding: "priority",
      header: "優先級",
      width: 76,
      minWidth: 68,
      align: "center",
    },
    {
      binding: "hours",
      header: "工時",
      width: 66,
      minWidth: 58,
      dataType: "number",
      align: "right",
    },
    { binding: "status", header: "狀態", width: 82, minWidth: 70 },
  ];
}

function createGridOptions() {
  return {
    locale: "zh-TW",
    allowDragging: "Rows",
    allowSorting: false,
    allowEditing: false,
    filterMode: ['excel', 'searchRow'],
    frozenColumns: 1,
    rowHeaderWidth: 44,
    alternatingRowStep: 1,
  };
}

var app = new Vue({
  data: function () {
    return {
      leftRows: window.createGridGridLeftRows(),
      rightRows: window.createGridGridRightRows(),
      columns: Object.freeze(createColumns()),
      gridOptions: Object.freeze(createGridOptions()),
      draggingEnabled: true,
      statusText:
        "可開始拖曳：落在資料列上半部或下半部，決定插入位置。",
    };
  },
  computed: {
    draggingMode: function () {
      return this.draggingEnabled ? "Rows" : "None";
    },
  },
  methods: {
    getGridName: function (grid) {
      return grid === this.$refs.leftGrid.control ? "待辦工作" : "進行中";
    },
    getPositionText: function (position) {
      return position === "before" ? "之前" : "之後";
    },
    handleDraggedRow: function (event) {
      var targetText;
      if (event.role === "source") {
        return;
      }
      targetText = event.targetItem
        ? "「" +
          event.targetItem.name +
          "」" +
          this.getPositionText(event.position)
        : "清單尾端";
      if (event.sourceGrid === event.targetGrid) {
        this.statusText =
          "已在「" +
          this.getGridName(event.targetGrid) +
          "」重排「" +
          event.item.name +
          "」，放在" +
          targetText +
          "。";
      } else {
        this.statusText =
          "已將「" +
          event.item.name +
          "」從「" +
          this.getGridName(event.sourceGrid) +
          "」移到「" +
          this.getGridName(event.targetGrid) +
          "」，放在" +
          targetText +
          "。";
      }
    },
    toggleDragging: function () {
      this.draggingEnabled = !this.draggingEnabled;
      this.statusText = this.draggingEnabled
        ? "已開啟左右 Grid 資料列拖曳。"
        : "已關閉左右 Grid 資料列拖曳。";
    },
    resetData: function () {
      this.leftRows = window.createGridGridLeftRows();
      this.rightRows = window.createGridGridRightRows();
      this.statusText = "已重設左右 Grid 資料。";
    },
  },
});

window.gridGridVue2Demo = app;
app.$mount("#app");
</script>

<style>
@import "../dist/fabui.css?v=20260722-theme-css-split-v1";
@import "./style/grid-grid.css";
</style>
