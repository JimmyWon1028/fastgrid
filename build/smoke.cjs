const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const port = 4174;
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

function serveFile(req, res) {
  const urlPath = req.url.split('?')[0] === '/' ? '/test/smoke.html' : req.url.split('?')[0];
  const baseDir = urlPath.indexOf('/dist/') === 0 ? distDir : root;
  const relativePath = urlPath.indexOf('/dist/') === 0 ?
    urlPath.slice('/dist/'.length) :
    urlPath;
  const filePath = path.normalize(path.join(baseDir, relativePath));
  if (filePath !== baseDir && filePath.indexOf(baseDir + path.sep) !== 0) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, function(error, body) {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'text/plain; charset=utf-8' });
    res.end(body);
  });
}

function runChrome() {
  return new Promise(function(resolve, reject) {
    const args = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--virtual-time-budget=3000',
      '--dump-dom',
      'http://127.0.0.1:' + port + '/test/smoke.html'
    ];
    const child = spawn(chromePath, args);
    let output = '';
    let errorOutput = '';
    child.stdout.on('data', function(chunk) {
      output += chunk.toString();
    });
    child.stderr.on('data', function(chunk) {
      errorOutput += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', function(code) {
      if (code !== 0) {
        reject(new Error(errorOutput || 'Chrome exited with code ' + code));
        return;
      }
      resolve(output);
    });
  });
}

function extractResult(dom) {
  const match = dom.match(/<pre id="result">([\s\S]*?)<\/pre>/);
  if (!match) {
    throw new Error('Smoke result was not found.');
  }
  return JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

const server = http.createServer(serveFile);

server.listen(port, '127.0.0.1', async function() {
  try {
    const dom = await runChrome();
    const result = extractResult(dom);
    if (
      !result.hasChart ||
      !result.chartRenderWorks ||
      !result.chartBindingWorks ||
      !result.chartPieWorks ||
      !result.chartDisposeWorks ||
      !result.hasEditBox ||
      !result.editBoxCoreBundleWorks ||
      !result.hasCalendar ||
      !result.calendarCoreBundleWorks ||
      !result.hasCheckBox ||
      !result.checkBoxCoreBundleWorks ||
      !result.hasSwitchButton ||
      !result.switchButtonCoreBundleWorks ||
      !result.hasCheckGroup ||
      !result.checkGroupCoreBundleWorks ||
      !result.hasRadioButton ||
      !result.radioButtonCoreBundleWorks ||
      !result.hasRadioGroup ||
      !result.radioGroupCoreBundleWorks ||
      !result.hasFileBox ||
      !result.fileBoxCoreBundleWorks ||
      !result.hasForm ||
      !result.formCoreBundleWorks ||
      !result.hasTabs ||
      !result.tabsCoreBundleWorks ||
      !result.hasTree ||
      !result.treeCoreBundleWorks ||
      !result.hasPropertyGrid ||
      !result.propertyGridCoreBundleWorks ||
      !result.hasDiagram ||
      !result.diagramCoreBundleWorks ||
      !result.hasTooltip ||
      !result.tooltipCoreBundleWorks ||
      !result.hasMenu ||
      !result.menuCoreBundleWorks ||
      !result.hasMenuButton ||
      !result.menuButtonCoreBundleWorks ||
      !result.hasSplitButton ||
      !result.splitButtonCoreBundleWorks ||
      !result.hasMessager ||
      !result.messagerCoreBundleWorks ||
      !result.hasPanel ||
      !result.panelCoreBundleWorks ||
      !result.hasLayout ||
      !result.layoutCoreBundleWorks ||
      !result.hasWindow ||
      !result.windowCoreBundleWorks ||
      !result.hasFabGrid ||
      !result.controlLookupWorks ||
      !result.coreBundleOnlyWorks ||
      !result.filterHeaderTextVerticallyCenteredWorks ||
      !result.filterHeaderTextClearsIconWorks ||
      !result.rightAlignedHeaderTextAnchorStableWorks ||
      !result.rightAlignedHeaderAdaptiveInsetWorks ||
      !result.narrowFilterTextOverlapsIconWorks ||
      !result.narrowSortFilterGapWorks ||
      !result.excelFilterPopupDynamicHeightWorks ||
      !result.excelFilterPopupAlignsHeaderLeftWorks ||
      !result.excelFilterPopupBottomShadowWorks ||
      !result.filterIconClickDoesNotSortWorks ||
      !result.headerResizeHitAreaWorks ||
      !result.dangerousBindingBlocked ||
      !result.specialGroupKeyWorks ||
      !result.rowTypesWork ||
      !result.headerSearchEnterAlignmentWorks ||
      !result.headerSearchContainerScrollWorks ||
      !result.paginationInitialPageWorks ||
      !result.paginationLastPageWorks ||
      !result.paginationPageSizeWorks ||
      !result.paginationPagerWorks ||
      !result.remoteInitialLoadWorks ||
      !result.remoteSecondPageWorks ||
      !result.remoteRequestFormatWorks ||
      result.totalRowsAfterSearch !== 1 ||
      result.firstAmountAfterEdit !== 123456 ||
      result.copiedText !== '123456' ||
      result.clipString !== '123456' ||
      !result.itemsSourceAliasWorks ||
      !result.itemsSourceGetterWorks ||
      !result.itemsSourceSetterWorks ||
      !result.itemsSourceRestoreWorks ||
      !result.footerVisibleWorks ||
      !result.footerDefaultNumberFormatWorks ||
      !result.footerAmountTextAlignWorks ||
      !result.footerAmountRightEdgeWorks ||
      !result.headerToggleKeyWorks ||
      !result.sortIconNearHeaderTextWorks ||
      !result.multiColumnSortWorks ||
      !result.multiColumnDirectionWorks ||
      !result.singleColumnSortResetWorks ||
      !result.sortSelectedRowWorks ||
      !result.multiSortSelectedRowsWork ||
      !result.headerDividerResizeWorks ||
      result.resizeStartWidth !== 150 ||
      result.resizeEndWidth !== 180 ||
      !isTransparentColor(result.resizeLineBackground) ||
      !result.headerDividerAutoFitWorks ||
      result.autoFitEndWidth <= result.resizeEndWidth ||
      !result.autoFitEventsWork ||
      !result.rowHeadersHiddenWorks ||
      !result.rowHeadersShownWorks ||
      !result.rowHeadersCellOnlyWorks ||
      !result.multiSelectColumnVisibleWorks ||
      !result.selectionCellBackgroundWorks ||
      !result.selectAllCheckboxAlignedWorks ||
      !result.multiSelectRowsWorks ||
      !result.multiCellClickToggleOffWorks ||
      !result.multiCellClickToggleOnWorks ||
      !result.multiRowClickToggleOffWorks ||
      !result.multiSelectAllWorks ||
      !result.multiSelectClearAllWorks ||
      !result.multiArrowDownDoesNotSelectRowWorks ||
      !result.multiArrowUpDoesNotSelectRowWorks ||
      !result.pageDownNavigationWorks ||
      !result.pageUpNavigationWorks ||
      !result.moveToBottomHotKeyWorks ||
      !result.moveToTopHotKeyWorks ||
      !result.moveToRightHotKeyWorks ||
      !result.moveToLeftHotKeyWorks ||
      !result.macFnHorizontalHotKeysWork ||
      !result.multiSelectColumnHiddenWorks ||
      !result.collectionViewAliasWorks ||
      !result.rowsCompatibilityWorks ||
      !result.formatItemCellTypesWork ||
      !result.cellTemplateWorks ||
      !result.cellTemplateStyleMergeWorks ||
      !result.cellTemplateDataUntouchedWorks ||
      !result.columnChooserEscapeWorks ||
      !result.columnChooserInsidePointerWorks ||
      !result.columnChooserOutsidePointerWorks ||
      !result.hitTestWorks ||
      !result.managedDomEventWorks ||
      !result.managedDomEventDisposeWorks ||
      !result.jsonApiWorks ||
      !result.jsonViewOnlyWorks ||
      !result.getColumnWorks ||
      !result.isReadOnlyAliasWorks ||
      !result.itemFormatterAliasWorks ||
      !result.scrollPositionAliasWorks ||
      !result.scrollSizeAliasWorks ||
      !result.viewRangeAliasWorks ||
      !result.activeCellAliasWorks ||
      !result.selectedItemsAliasWorks ||
      !result.selectedRowsAliasWorks ||
      !result.selectedRangesAliasWorks ||
      !result.alternatingRowStepWorks ||
      !result.frozenRightColumnsAliasWorks ||
      result.alternatingRowCells < 1 ||
      result.alternatingRowHeaderCells < 1 ||
      result.evenRowCells < 1 ||
      result.evenRowHeaderCells < 1 ||
      result.alternatingRowComputedBackground !== 'rgb(250, 250, 250)' ||
      result.sampleCellColor !== 'rgb(0, 0, 0)' ||
      result.sampleRowHeaderColor !== 'rgb(128, 128, 128)' ||
      result.sampleHeaderColor !== 'rgb(128, 128, 128)' ||
      !isTransparentColor(result.sampleRowHeaderBackground) ||
      result.sampleRowHeaderBackgroundImage === 'none' ||
      result.sampleHeaderBackground !== 'rgb(239, 239, 239)' ||
      result.sampleHeaderBackgroundImage === 'none' ||
      !isNormalFontWeight(result.sampleRowHeaderFontWeight) ||
      !isNormalFontWeight(result.sampleHeaderFontWeight) ||
      result.hoveredEvenRowCells < 2 ||
      result.hoveredEvenRowBackground !== 'rgb(237, 246, 255)' ||
      !result.cellClickSelectsRowWorks ||
      !result.cellClickSelectedBackgroundWorks ||
      !result.cellClickKeepsRowSelectedWorks ||
      !result.singleSpaceKeepsSelectedRowWorks ||
      !result.singleSpaceStillKeepsSelectedRowWorks ||
      !result.multiSpaceSelectsRowWorks ||
      !result.multiSpaceTogglesRowOffWorks ||
      !result.readOnlyArrowDownSelectsRowWorks ||
      !result.readOnlyArrowRightKeepsRowSelectedWorks ||
      !result.readOnlyArrowLeftKeepsRowSelectedWorks ||
      !result.editModeAliasWorks ||
      !result.editOnSelectWorks ||
      !result.clickEditSelectsEditorTextWorks ||
      !result.readOnlyColumnClickDoesNotEdit ||
      !result.readOnlyCellActiveIsUnique ||
      !result.readOnlyClickFinishesPreviousEditWorks ||
      !result.readOnlyCellArrowDownKeepsSameColumnWorks ||
      !result.readOnlyCellArrowUpKeepsSameColumnWorks ||
      !result.enterMovesToNextEditableColumnWorks ||
      !result.tabMovesToNextEditableColumnWorks ||
      !result.shiftEnterMovesToPreviousEditableColumnWorks ||
      !result.shiftTabMovesToPreviousEditableColumnWorks ||
      !result.editArrowDownMovesAndKeepsEditingWorks ||
      !result.editArrowUpMovesAndKeepsEditingWorks ||
      !result.multiEditArrowDownDoesNotSelectRowWorks ||
      !result.multiEditArrowUpDoesNotSelectRowWorks ||
      !result.maskDisplayWorks ||
      !result.maskCopyRawWorks ||
      !result.maskEditorInitialWorks ||
      !result.maskEditorCopyRawWorks ||
      !result.maskEditorFormatsInputWorks ||
      !result.maskBackspaceDeletesAcrossLiteralWorks ||
      !result.maskCommitRawWorks ||
      !result.textDateDateboxEditorWorks ||
      !result.textDateDateboxPanelHiddenOnStartWorks ||
      !result.textDateDateboxPanelOpensOnButtonWorks ||
      !result.textDateDateboxKeepsMaskWorks ||
      !result.textDateDateboxCommitRawWorks ||
      !result.maskDefaultIncludesMaskWorks ||
      !result.maskDefaultCopyIncludesMaskWorks ||
      !result.maskDefaultDateboxCommitIncludesMaskWorks ||
      !result.dashMaskDateDisplayWorks ||
      !result.dashMaskDateCopyWorks ||
      !result.dashMaskDateEditorWorks ||
      !result.dashMaskDateInputWorks ||
      !result.dashMaskDatePickerKeepsMaskWorks ||
      !result.dashMaskDateCommitWorks ||
      !result.clickedCellScrollsColumnIntoViewWorks ||
      !result.numberZeroInputWorks ||
      !result.numberZeroDisplaysAsZeroWorks ||
      !result.numberBlankInputWorks ||
      !result.numberBlankDisplaysEmptyWorks ||
      !result.numberEditorShowsThousandsWorks ||
      !result.scrollableEditorStaysBelowFrozenPaneWorks ||
      !result.numberEditorLiveThousandsWorks ||
      !result.numberThousandsCommitWorks ||
      !result.numberCopyWithoutThousandsWorks ||
      !result.numberEditorCopyWithoutThousandsWorks ||
      !result.numberEditorNoThousandsWorks ||
      !result.numberEditorLiveNoThousandsWorks ||
      !result.numberEditorOnlyAllowsNumberKeysWorks ||
      !result.numberNegativeCommitWorks ||
      !result.customColumnValidateReceivesNumberWorks ||
      !result.customColumnValidateWorks ||
      !result.customColumnValidateClearsWorks ||
      !result.asyncColumnValidateDoesNotBlockWorks ||
      !result.asyncColumnValidateReceivesNumberWorks ||
      !result.asyncColumnValidateWorks ||
      !result.asyncColumnValidateClearsWorks ||
      !result.textboxDefaultEditorWorks ||
      !result.customEditorButtonDisplaysWorks ||
      !result.customEditorButtonCallbackWorks ||
      !result.numberboxEditorConfigWorks ||
      !result.comboboxEditorConfigWorks ||
      !result.comboboxPanelOpensWorks ||
      !result.comboboxSelectUpdatesInputWorks ||
      !result.comboboxSelectCommitWorks ||
      !result.comboboxTypedCommitWorks ||
      !result.comboboxAltArrowDownOpensWorks ||
      !result.comboboxArrowDownMovesActiveWorks ||
      !result.comboboxKeyboardSelectWorks ||
      !result.comboboxKeyboardCommitWorks ||
      !result.comboboxLimitEditorInitialWorks ||
      !result.comboboxValueInListWorks ||
      !result.comboboxPanelWidthWorks ||
      !result.comboboxLimitToListInvalidWorks ||
      !result.comboboxLimitToListClearsWorks ||
      !result.dateboxEditorConfigWorks ||
      !result.dateboxOnlyAllowsDigitKeysWorks ||
      !result.dateboxBackspaceDeletesAcrossLiteralWorks ||
      !result.dateboxTriggerUsesImageWorks ||
      !result.dateboxCustomIconsIgnoredWorks ||
      !result.dateboxPanelHiddenOnStartWorks ||
      !result.dateboxPanelOpensWorks ||
      !result.dateboxMonthViewOpensWorks ||
      !result.dateboxYearInputChangesWorks ||
      !result.dateboxMonthSelectReturnsCalendarWorks ||
      !result.dateboxPanelClosesOnScrollWorks ||
      !result.dateboxSelectUpdatesInputWorks ||
      !result.dateboxSelectedCommitWorks ||
      !result.dateboxInvalidCommitMovesNextCellWorks ||
      !result.dateboxInvalidCellMarkerWorks ||
      !result.invalidTipWorks ||
      !result.dateboxInvalidItemsPropertyWorks ||
      !result.dateboxValidCommitClearsValidationWorks ||
      !result.yearMonthInvalidValidationWorks ||
      !result.yearMonthValidCommitClearsValidationWorks ||
      !result.validateRowInvalidWorks ||
      !result.validateRowValidWorks ||
      !result.englishEmptyTextWorks ||
      !result.englishEditorAriaWorks ||
      !result.englishBusyTextWorks ||
      !result.zhEmptyTextWorks ||
      !result.localeStaticsWork ||
      !result.embeddedLocalesWork ||
      !result.headerToggleDefaultDisabledWorks ||
      !result.dateboxEditorAlignsSelectedCellWorks ||
      !result.dateboxEditorHorizontalScrollAlignsSelectedCellWorks ||
      !result.editingRowSelectedBackgroundWorks ||
      !result.readOnlyModeDisablesEditingWorks ||
      result.cellClickRowSelection < 0 ||
      result.cellClickSelectedCol < 0 ||
      !result.wijmoEvents ||
      result.wijmoEvents.beginningEdit < 1 ||
      result.wijmoEvents.cellEditEnding < 1 ||
      result.wijmoEvents.cellEditEnded < 1 ||
      result.wijmoEvents.copying < 1 ||
      result.wijmoEvents.copied < 1 ||
      result.wijmoEvents.formatItem < 1 ||
      result.wijmoEvents.selectionChanged < 1 ||
      result.excelSize <= 1000 ||
      result.excelType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      !result.excelHasFrozenPane ||
      !result.excelHasAutoFilter ||
      !result.excelHasFooterRow ||
      !result.excelAmountNumberFormatWorks ||
      !result.excelHasStyledCells ||
      !result.excelHasHeaderFill ||
      !result.excelHasGridBorder ||
      !result.excelHasCellColor ||
      !result.excelHasCellBackground ||
      !result.largeExportScrollKeepsScrollableCells ||
      !result.largeFastScrollImmediateRenderWorks ||
      !result.largeFastScrollBufferedRowsWorks ||
      !result.fixedPaneWheelSyncWorks ||
      result.largeExportScrollCellCount < 1 ||
      !result.busyOverlayWorks ||
      !result.busyOverlayClearsWorks ||
      result.rowSelection !== 0 ||
      result.rowHeaderTopText !== '' ||
      result.rowHeaderWidth !== '60px' ||
      result.firstRowHeaderText !== '1' ||
      result.rowHeaderCells < 1 ||
      result.rowSelectedCells < 1 ||
      result.rowHoveredCells < 1 ||
      !isTransparentColor(result.selectedRowHeaderBackground) ||
      result.selectedRowHeaderBackgroundImage === 'none' ||
      result.selectedRowHeaderColor !== 'rgb(128, 128, 128)' ||
      result.measuredScrollbarHeight < 1 ||
      result.measuredFooterHeight !== 28 ||
      result.rowHeaderPaneBottom !== result.frozenPaneBottom ||
      result.rowHeaderPaneBottom !== result.frozenRightPaneBottom ||
      result.gutterLeaksBeforeSearch > 12 ||
      result.bottomGapBeforeSearch > 2 ||
      result.idHeaderTextAlign !== 'center' ||
      result.amountHeaderTextAlign !== 'right' ||
      result.amountHeaderSortDisplay !== 'none' ||
      result.editorTextAlign !== 'right' ||
      result.editorBackgroundColor !== 'rgb(190, 252, 255)' ||
      result.gridFontSize !== '14px' ||
      result.frozenRightCells < 1 ||
      result.frozenRightHeaders !== 1 ||
      result.footerCells < 1 ||
      result.footerHeight !== '28px' ||
      result.footerBottom !== '0px' ||
      result.frozenRightWidth !== '110px'
    ) {
      throw new Error('Smoke assertions failed: ' + JSON.stringify(result));
    }
    const requiredDistFiles = [
      'fabui.css',
      'fabui.js',
      'fabui.min.css',
      'fabui.min.js',
      'theme'
    ];
    const standaloneBundlePattern = /^fabui\.(?:diagram|lite|gantt|scheduler)(?:\..+)?$/;
    const actualDistFiles = fs.readdirSync(path.join(root, 'dist')).filter(function(file) {
      return file !== '.DS_Store';
    }).sort();
    const missingDistFiles = requiredDistFiles.filter(function(file) {
      return actualDistFiles.indexOf(file) < 0;
    });
    const unexpectedDistFiles = actualDistFiles.filter(function(file) {
      return requiredDistFiles.indexOf(file) < 0 && !standaloneBundlePattern.test(file);
    });
    const unexpectedEsmFiles = actualDistFiles.filter(function(file) {
      return /\.esm(?:\.min)?\.js$/i.test(file);
    });
    if (missingDistFiles.length || unexpectedDistFiles.length || unexpectedEsmFiles.length) {
      throw new Error(
        'Smoke assertions failed: unexpected dist output missing=' +
        JSON.stringify(missingDistFiles) +
        ' unexpected=' +
        JSON.stringify(unexpectedDistFiles) +
        ' esm=' +
        JSON.stringify(unexpectedEsmFiles)
      );
    }
    if (!fs.existsSync(path.join(root, 'dist', 'theme', 'images', 'datebox_arrow.png')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.black.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.black.min.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'black', 'images', 'pagination_icons.png')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.mono.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.mono.min.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.mono-red.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.mono-red.min.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.mono-green.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'fabui.mono-green.min.css')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'mono', 'pagination-first.svg')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'mono', 'panel-close.svg')) ||
      !fs.existsSync(path.join(root, 'dist', 'theme', 'mono', 'tree-folder.svg'))) {
      throw new Error('Smoke assertions failed: theme dependencies are incomplete.');
    }
    if (fs.existsSync(path.join(root, 'dist', 'theme', 'images-mono')) ||
      fs.existsSync(path.join(root, 'dist', 'theme', 'mono', 'images')) ||
      fs.existsSync(path.join(root, 'dist', 'theme', 'mono-red', 'images')) ||
      fs.existsSync(path.join(root, 'dist', 'theme', 'mono-green', 'images'))) {
      throw new Error('Smoke assertions failed: Mono family icons must only use dist/theme/mono.');
    }
    if (fs.readdirSync(path.join(root, 'dist', 'theme')).some(function(file) {
      return /^fabgrid\..+\.css$/i.test(file);
    })) {
      throw new Error('Smoke assertions failed: legacy FabGrid theme CSS filenames remain.');
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

function isNormalFontWeight(value) {
  return value === 'normal' || value === '400';
}

function isTransparentColor(value) {
  return value === 'transparent' || value === 'rgba(0, 0, 0, 0)';
}
