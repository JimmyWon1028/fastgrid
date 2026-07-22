<template>
  <main class="grid-tree-page" data-demo-adapter="vue2">
    <header class="grid-tree-header">
      <div>
        <h1>FabGrid Grid + TreeGrid 拖曳</h1>
        <p>Vue 2：左側 Grid 資料列可拖入右側 TreeGrid；右側節點可調整順序與上下階。</p>
      </div>
      <div class="grid-tree-actions">
        <button
          type="button"
          :class="{ 'grid-tree-drag-toggle-active': draggingEnabled }"
          :aria-pressed="draggingEnabled ? 'true' : 'false'"
          @click="toggleDragging"
        >
          {{ draggingEnabled ? "關閉拖曳" : "開啟拖曳" }}
        </button>
        <button type="button" @click="expandTree">全部展開</button>
        <button type="button" @click="resetData">重設資料</button>
      </div>
    </header>

    <section class="grid-tree-layout">
      <article class="grid-tree-panel">
        <div class="grid-tree-panel-header">
          <div>
            <h2>待配置 Grid</h2>
            <p>拖曳任一資料列到右側組織節點。</p>
          </div>
          <span class="grid-tree-count">{{ poolRows.length }} 筆</span>
        </div>
        <fab-grid
          ref="poolGrid"
          class="grid-tree-control"
          :items-source="poolRows"
          :columns="poolColumns"
          :grid-options="poolGridOptions"
          :allow-dragging="draggingMode"
          @initialized="handlePoolInitialized"
          @dragged-row="handleDraggedRow"
        ></fab-grid>
      </article>

      <article class="grid-tree-panel">
        <div class="grid-tree-panel-header">
          <div>
            <h2>組織 TreeGrid</h2>
            <p>拖到上緣／中央／下緣，分別代表之前／下階／之後。</p>
          </div>
          <span class="grid-tree-count">{{ treeNodeCount }} 節點</span>
        </div>
        <fab-grid
          ref="treeGrid"
          class="grid-tree-control"
          :items-source="treeRows"
          :columns="treeColumns"
          :grid-options="treeGridOptions"
          :allow-dragging="draggingMode"
          @initialized="handleTreeInitialized"
          @dragged-row="handleDraggedRow"
        ></fab-grid>
      </article>
    </section>

    <footer class="grid-tree-footer">
      <div class="grid-tree-drop-help" aria-label="TreeGrid 拖曳落點說明">
        <span><i class="drop-before"></i>上緣：同層之前</span>
        <span><i class="drop-inside"></i>中央：成為子節點</span>
        <span><i class="drop-after"></i>下緣：同層之後</span>
      </div>
      <div class="grid-tree-status" aria-live="polite">{{ statusText }}</div>
    </footer>
  </main>
</template>

<script>
import "./grid-treegrid-data.js?v=20260715-grid-treegrid-vue2-v1";

function createColumns(tree) {
  return [
    {
      binding: "name",
      header: tree ? "組織／團隊" : "待配置項目",
      width: tree ? 210 : 170,
      minWidth: 120,
    },
    { binding: "nodeId", header: "代碼", width: 92, minWidth: 78 },
    { binding: "owner", header: "負責人", width: 90, minWidth: 78 },
    {
      binding: "headcount",
      header: "人數",
      width: 68,
      minWidth: 60,
      dataType: "number",
      align: "right",
    },
    { binding: "status", header: "狀態", width: 84, minWidth: 72 },
  ];
}

function createBaseGridOptions() {
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

function createTreeGridOptions() {
  var options = createBaseGridOptions();
  options.childItemsPath = "children";
  options.treeColumn = "name";
  options.treeIndent = 20;
  return options;
}

function countTreeNodes(rows) {
  var count = 0;
  var i;
  rows = Array.isArray(rows) ? rows : [];
  for (i = 0; i < rows.length; i += 1) {
    count += 1 + countTreeNodes(rows[i].children);
  }
  return count;
}

var app = new Vue({
  data: function () {
    return {
      poolRows: window.createGridTreeDragPool(),
      treeRows: window.createGridTreeDragTree(),
      poolColumns: Object.freeze(createColumns(false)),
      treeColumns: Object.freeze(createColumns(true)),
      poolGridOptions: Object.freeze(createBaseGridOptions()),
      treeGridOptions: Object.freeze(createTreeGridOptions()),
      draggingEnabled: true,
      poolControl: null,
      treeControl: null,
      statusText:
        "可開始拖曳：TreeGrid 中央落點會將節點移到下一階。",
    };
  },
  computed: {
    draggingMode: function () {
      return this.draggingEnabled ? "Rows" : "None";
    },
    treeNodeCount: function () {
      return countTreeNodes(this.treeRows);
    },
  },
  methods: {
    handlePoolInitialized: function (control) {
      this.poolControl = control;
    },
    handleTreeInitialized: function (control) {
      this.treeControl = control;
      this.treeControl.expandAllTreeNodes();
    },
    getPositionText: function (position) {
      if (position === "before") {
        return "同層之前";
      }
      if (position === "after") {
        return "同層之後";
      }
      return "成為子節點";
    },
    handleDraggedRow: function (event) {
      if (event.role === "source") {
        return;
      }
      this.statusText =
        "已移動「" +
        event.item.name +
        "」：" +
        this.getPositionText(event.position) +
        (event.targetItem ? "「" + event.targetItem.name + "」" : "根節點尾端");
    },
    toggleDragging: function () {
      this.draggingEnabled = !this.draggingEnabled;
      this.statusText = this.draggingEnabled
        ? "已開啟 Grid 與 TreeGrid 資料列拖曳。"
        : "已關閉 Grid 與 TreeGrid 資料列拖曳。";
    },
    expandTree: function () {
      if (this.treeControl) {
        this.treeControl.expandAllTreeNodes();
      }
      this.statusText = "已展開所有 TreeGrid 節點。";
    },
    resetData: function () {
      var self = this;
      this.poolRows = window.createGridTreeDragPool();
      this.treeRows = window.createGridTreeDragTree();
      this.$nextTick(function () {
        if (self.treeControl) {
          self.treeControl.expandAllTreeNodes();
        }
      });
      this.statusText = "已重設 Grid 與 TreeGrid 資料。";
    },
  },
});

window.gridTreeGridVue2Demo = app;
app.$mount("#app");
</script>

<style>
@import "../dist/fabui.css?v=20260722-theme-css-split-v1";
@import "./style/grid-treegrid.css";
</style>
