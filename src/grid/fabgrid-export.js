var exportContext = {};

function exportGetByBinding(item, binding) {
  return exportContext.getByBinding ? exportContext.getByBinding(item, binding) : undefined;
}

function exportToNumber(value, fallback) {
  return exportContext.toNumber ? exportContext.toNumber(value, fallback) : (isFinite(Number(value)) ? Number(value) : fallback);
}

function exportGetNumberPrecision(column) {
  return exportContext.getNumberPrecision ? exportContext.getNumberPrecision(column) : null;
}

function exportShouldUseThousandsSeparator(column) {
  return exportContext.shouldUseThousandsSeparator ? exportContext.shouldUseThousandsSeparator(column) : false;
}

function exportParseValue(value, type) {
  if (exportContext.parseValue) return exportContext.parseValue(value, type);
  if (type === 'boolean') return value === true || value === 'true' || value === '1' || value === 'yes' || value === 'Y';
  return value;
}

export function csvEscape(value) {
  var text = value == null ? '' : String(value);
  if (text.indexOf('"') >= 0 || text.indexOf(',') >= 0 || text.indexOf('\n') >= 0) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

export function getExcelColumnName(index) {
  var name = '';
  var number = index;
  while (number > 0) {
    number -= 1;
    name = String.fromCharCode(65 + (number % 26)) + name;
    number = Math.floor(number / 26);
  }
  return name;
}

export function getXmlSpaceAttribute(value) {
  var text = String(value);
  return /^\s|\s$|\s\s/.test(text) ? ' xml:space="preserve"' : '';
}

export function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function cssColorToExcelColor(value) {
  var match;
  var hex;
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '';
  if (value.charAt(0) === '#') {
    hex = value.length === 4 ?
      value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2) + value.charAt(3) + value.charAt(3) :
      value.slice(1, 7);
    return 'FF' + hex.toUpperCase();
  }
  match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (!match || match[4] === '0') return '';
  return 'FF' + toHexByte(match[1]) + toHexByte(match[2]) + toHexByte(match[3]);
}

export function normalizeExcelStyle(style) {
  return {
    color: cssColorToExcelColor(style.color || style.textColor || ''),
    backgroundColor: cssColorToExcelColor(style.backgroundColor || style.background || ''),
    bold: style.bold === true || style.fontWeight === 'bold' || Number(style.fontWeight) >= 600,
    align: normalizeExcelAlign(style.align || style.textAlign || ''),
    numFmtCode: style.numFmtCode || style.numberFormat || ''
  };
}

export function mergeExcelStyle(base, override) {
  var result = {};
  var key;
  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) result[key] = base[key];
  }
  for (key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key) && override[key]) result[key] = override[key];
  }
  return result;
}

export function normalizeExcelAlign(value) {
  return value === 'right' || value === 'center' || value === 'left' ? value : '';
}

export function createExcelCell(row, col, value, type, styleId) {
  var ref = getExcelColumnName(col) + row;
  var style = styleId ? ' s="' + styleId + '"' : '';
  if (value == null) return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t></t></is></c>';
  if (type === 'number' && typeof value !== 'boolean' && isFinite(Number(value))) {
    return '<c r="' + ref + '"' + style + '><v>' + Number(value) + '</v></c>';
  }
  if (type === 'boolean') {
    return '<c r="' + ref + '"' + style + ' t="b"><v>' + (exportParseValue(value, 'boolean') ? '1' : '0') + '</v></c>';
  }
  return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t' + getXmlSpaceAttribute(value) + '>' + xmlEscape(value) + '</t></is></c>';
}

function toHexByte(value) {
  var hex = Math.max(0, Math.min(255, Number(value))).toString(16).toUpperCase();
  return hex.length === 1 ? '0' + hex : hex;
}

export function installFabGridExport(FabGrid, context) {
  exportContext = context || {};
  var getByBinding = context.getByBinding;

  FabGrid.prototype.getCsv = function(visibleOnly) {
    var columns = visibleOnly === false ? this.columns : this.visibleColumns;
    var lines = [];
    var i;
    var r;
    var row;
    var values;
    lines.push(columns.map(function(col) {
      return csvEscape(col.header || col.binding);
    }).join(','));
    for (r = 0; r < this.view.length; r += 1) {
      row = this.view[r];
      if (this.isRowGroup(row) || this.isRowGroupFooter(row)) continue;
      values = [];
      for (i = 0; i < columns.length; i += 1) {
        values.push(csvEscape(getByBinding(row, columns[i].binding)));
      }
      lines.push(values.join(','));
    }
    return lines.join('\n');
  };

  FabGrid.prototype.exportCsv = function(filename, visibleOnly) {
    var csv = this.getCsv(visibleOnly);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename || 'fabgrid.csv');
  };

  FabGrid.prototype.getExcelBlob = function(visibleOnly) {
    var columns = visibleOnly === true ? this.visibleColumns : this.columns;
    var files = createXlsxFiles(columns, this.view || this.dataView, {
      frozenColumns: visibleOnly === true ? this.frozenColumns : this.getExcelFrozenColumnCount(),
      headerDisplayMode: this.getHeaderDisplayMode(),
      grid: this,
      formatCell: this.options.formatCell,
      excelCellStyle: this.options.excelCellStyle,
      includeFooter: this.getFooterHeight() > 0
    });
    return new Blob([createZip(files)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  };


  FabGrid.prototype.getExcelFrozenColumnCount = function() {
    var lastFrozenColumn;
    var sourceIndex;
    if (!this.frozenColumns) return 0;
    lastFrozenColumn = this.visibleColumns[this.frozenColumns - 1];
    sourceIndex = this.columns.indexOf(lastFrozenColumn);
    return sourceIndex < 0 ? 0 : sourceIndex + 1;
  };

  FabGrid.prototype.exportExcel = function(filename, visibleOnly) {
    var self = this;
    var outputName = filename || 'fabgrid.xlsx';
    if (this.busy) return Promise.resolve(false);
    this.setBusy(true, this.options.exportBusyText || this.getText('exportBusyText'));
    this.emit('excelExporting', { filename: outputName });
    return new Promise(function(resolve, reject) {
      requestAnimationFrame(function() {
        setTimeout(function() {
          var blob;
          try {
            blob = self.getExcelBlob(visibleOnly);
            downloadBlob(blob, outputName);
            self.emit('excelExported', { filename: outputName, blob: blob });
            resolve(true);
          } catch (error) {
            self.emit('excelExportFailed', { filename: outputName, error: error });
            reject(error);
          } finally {
            self.setBusy(false);
          }
        }, 0);
      });
    });
  };
}

function downloadBlob(blob, filename) {
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createXlsxFiles(columns, rows, options) {
  var now = new Date().toISOString();
  var registry = createExcelStyleRegistry();
  var worksheet = createWorksheetXml(columns, rows, options || {}, registry);
  return [
    {
      name: '[Content_Types].xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>'
    },
    {
      name: '_rels/.rels',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'docProps/app.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
        '<Application>FabGrid</Application>' +
        '</Properties>'
    },
    {
      name: 'docProps/core.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        '<dc:creator>FabGrid</dc:creator>' +
        '<cp:lastModifiedBy>FabGrid</cp:lastModifiedBy>' +
        '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
        '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified>' +
        '</cp:coreProperties>'
    },
    {
      name: 'xl/workbook.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>' +
        '</workbook>'
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'xl/styles.xml',
      content: createExcelStylesXml(registry)
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: worksheet
    }
  ];
}

export function createExcelStyleRegistry() {
  var registry = {
    fonts: [
      { bold: false, color: null },
      { bold: true, color: 'FF1F2937' }
    ],
    fills: [
      null,
      { gray125: true },
      { color: 'FFF5F7FA' }
    ],
    xfs: [
      { fontId: 0, fillId: 0, borderId: 0, align: '', numFmtId: 0 },
      { fontId: 1, fillId: 2, borderId: 1, align: 'center', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: '', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: 'right', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: 'center', numFmtId: 0 }
    ],
    numFmts: [],
    fontMap: { 'normal|': 0, 'bold|FF1F2937': 1 },
    fillMap: { none: 0, gray125: 1, FFF5F7FA: 2 },
    numFmtMap: {},
    nextNumFmtId: 164,
    xfMap: {
      '0|0|0|0|': 0,
      '1|2|1|center|0': 1,
      '0|0|1||0': 2,
      '0|0|1|right|0': 3,
      '0|0|1|center|0': 4
    }
  };
  return registry;
}

export function createExcelStylesXml(registry) {
  var xml = [];
  var i;
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  if (registry.numFmts.length) {
    xml.push('<numFmts count="' + registry.numFmts.length + '">');
    for (i = 0; i < registry.numFmts.length; i += 1) {
      xml.push('<numFmt numFmtId="' + registry.numFmts[i].id + '" formatCode="' + xmlEscape(registry.numFmts[i].code) + '"/>');
    }
    xml.push('</numFmts>');
  }
  xml.push('<fonts count="' + registry.fonts.length + '">');
  for (i = 0; i < registry.fonts.length; i += 1) {
    xml.push(createExcelFontXml(registry.fonts[i]));
  }
  xml.push('</fonts>');
  xml.push('<fills count="' + registry.fills.length + '">');
  for (i = 0; i < registry.fills.length; i += 1) {
    xml.push(createExcelFillXml(registry.fills[i]));
  }
  xml.push('</fills>');
  xml.push('<borders count="2">');
  xml.push('<border><left/><right/><top/><bottom/><diagonal/></border>');
  xml.push('<border>');
  xml.push('<left style="thin"><color rgb="FFD7DEE8"/></left>');
  xml.push('<right style="thin"><color rgb="FFD7DEE8"/></right>');
  xml.push('<top style="thin"><color rgb="FFD7DEE8"/></top>');
  xml.push('<bottom style="thin"><color rgb="FFD7DEE8"/></bottom>');
  xml.push('<diagonal/>');
  xml.push('</border>');
  xml.push('</borders>');
  xml.push('<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>');
  xml.push('<cellXfs count="' + registry.xfs.length + '">');
  for (i = 0; i < registry.xfs.length; i += 1) {
    xml.push(createExcelXfXml(registry.xfs[i]));
  }
  xml.push('</cellXfs>');
  xml.push('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
  xml.push('</styleSheet>');
  return xml.join('');
}

function createExcelFontXml(font) {
  var xml = ['<font>'];
  if (font.bold) {
    xml.push('<b/>');
  }
  xml.push('<sz val="11"/>');
  if (font.color) {
    xml.push('<color rgb="' + font.color + '"/>');
  }
  xml.push('<name val="Arial"/>');
  xml.push('</font>');
  return xml.join('');
}

function createExcelFillXml(fill) {
  if (!fill) {
    return '<fill><patternFill patternType="none"/></fill>';
  }
  if (fill.gray125) {
    return '<fill><patternFill patternType="gray125"/></fill>';
  }
  return '<fill><patternFill patternType="solid"><fgColor rgb="' + fill.color + '"/><bgColor indexed="64"/></patternFill></fill>';
}

function createExcelXfXml(xf) {
  var numFmtId = xf.numFmtId || 0;
  var xml = '<xf numFmtId="' + numFmtId + '" fontId="' + xf.fontId + '" fillId="' + xf.fillId + '" borderId="' + xf.borderId + '" xfId="0"';
  if (numFmtId) {
    xml += ' applyNumberFormat="1"';
  }
  if (xf.fontId) {
    xml += ' applyFont="1"';
  }
  if (xf.fillId) {
    xml += ' applyFill="1"';
  }
  if (xf.borderId) {
    xml += ' applyBorder="1"';
  }
  if (xf.align) {
    xml += ' applyAlignment="1"><alignment horizontal="' + xf.align + '" vertical="center"/></xf>';
    return xml;
  }
  if (xf.borderId) {
    xml += ' applyAlignment="1"><alignment vertical="center"/></xf>';
    return xml;
  }
  return xml + '/>';
}

function registerExcelCellStyle(registry, style) {
  var fontId = registerExcelFont(registry, style);
  var fillId = registerExcelFill(registry, style);
  var numFmtId = registerExcelNumberFormat(registry, style.numFmtCode || style.numberFormat || '');
  var borderId = 1;
  var align = style.align || '';
  var key = fontId + '|' + fillId + '|' + borderId + '|' + align + '|' + numFmtId;
  if (registry.xfMap[key] != null) {
    return registry.xfMap[key];
  }
  registry.xfs.push({
    fontId: fontId,
    fillId: fillId,
    borderId: borderId,
    align: align,
    numFmtId: numFmtId
  });
  registry.xfMap[key] = registry.xfs.length - 1;
  return registry.xfs.length - 1;
}

function registerExcelFont(registry, style) {
  var color = style.color || null;
  var bold = style.bold === true;
  var key = (bold ? 'bold' : 'normal') + '|' + (color || '');
  if (registry.fontMap[key] != null) {
    return registry.fontMap[key];
  }
  registry.fonts.push({ bold: bold, color: color });
  registry.fontMap[key] = registry.fonts.length - 1;
  return registry.fonts.length - 1;
}

function registerExcelFill(registry, style) {
  var color = style.backgroundColor || null;
  if (!color) {
    return 0;
  }
  if (registry.fillMap[color] != null) {
    return registry.fillMap[color];
  }
  registry.fills.push({ color: color });
  registry.fillMap[color] = registry.fills.length - 1;
  return registry.fills.length - 1;
}

function registerExcelNumberFormat(registry, code) {
  code = code || '';
  if (!code) {
    return 0;
  }
  if (registry.numFmtMap[code] != null) {
    return registry.numFmtMap[code];
  }
  registry.numFmts.push({
    id: registry.nextNumFmtId,
    code: code
  });
  registry.numFmtMap[code] = registry.nextNumFmtId;
  registry.nextNumFmtId += 1;
  return registry.numFmtMap[code];
}

export function createWorksheetXml(columns, rows, options, registry) {
  var includeFooter = options.includeFooter === true && options.grid;
  var dataMaxRow = rows.length + 1;
  var maxRow = dataMaxRow + (includeFooter ? 1 : 0);
  var maxCol = Math.max(columns.length, 1);
  var xml = [];
  var r;
  var c;
  var row;
  var styleResolver = createExcelStyleResolver(options);
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  xml.push('<dimension ref="A1:' + getExcelColumnName(maxCol) + maxRow + '"/>');
  xml.push(createSheetViewsXml(Math.min(exportToNumber(options.frozenColumns, 0), columns.length)));
  xml.push(createColumnWidthXml(columns));
  xml.push('<sheetData>');
  xml.push('<row r="1" ht="22" customHeight="1">');
  for (c = 0; c < columns.length; c += 1) {
    xml.push(createExcelCell(
      1,
      c + 1,
      options.headerDisplayMode === 'binding' ? columns[c].binding : (columns[c].header || columns[c].binding),
      'string',
      1
    ));
  }
  xml.push('</row>');
  for (r = 0; r < rows.length; r += 1) {
    row = rows[r];
    if (options.grid && options.grid.isRowGroup(row)) {
      xml.push(createExcelGroupRowXml(r + 2, row, columns, options.grid, registry));
      continue;
    }
    if (options.grid && options.grid.isRowGroupFooter(row)) {
      continue;
    }
    xml.push('<row r="' + (r + 2) + '">');
    for (c = 0; c < columns.length; c += 1) {
      xml.push(createExcelCell(
        r + 2,
        c + 1,
        exportGetByBinding(row, columns[c].binding),
        columns[c].dataType,
        getExcelCellStyle(columns[c], row, r, c, options, registry, styleResolver)
      ));
    }
    xml.push('</row>');
  }
  if (includeFooter) {
    xml.push(createExcelFooterRowXml(rows.length + 2, columns, options.grid));
  }
  if (styleResolver.dispose) {
    styleResolver.dispose();
  }
  xml.push('</sheetData>');
  xml.push('<autoFilter ref="A1:' + getExcelColumnName(maxCol) + dataMaxRow + '"/>');
  xml.push('</worksheet>');
  return xml.join('');
}

function createExcelGroupRowXml(rowIndex, group, columns, grid, registry) {
  var xml = [];
  var labelColumnIndex = 0;
  var level = Math.max(0, Math.min(7, exportToNumber(group.level, 0)));
  var value;
  var isLabel;
  var c;
  for (c = 0; c < columns.length; c += 1) {
    if (columns[c].visible !== false) {
      labelColumnIndex = c;
      break;
    }
  }
  xml.push('<row r="' + rowIndex + '" outlineLevel="' + level + '">');
  for (c = 0; c < columns.length; c += 1) {
    isLabel = c === labelColumnIndex;
    value = isLabel ? repeatString('  ', level) + group.label :
      (columns[c].aggregate ?
        grid.formatAggregateValue(grid.getRowGroupAggregateValue(group, columns[c]), columns[c], group.items) :
        '');
    xml.push(createExcelCell(
      rowIndex,
      c + 1,
      value,
      isLabel || columns[c].aggregate ? 'string' : columns[c].dataType,
      getExcelGroupCellStyle(columns[c], isLabel, registry)
    ));
  }
  xml.push('</row>');
  return xml.join('');
}

function createExcelFooterRowXml(rowIndex, columns, grid) {
  var xml = [];
  var c;
  var value;
  xml.push('<row r="' + rowIndex + '">');
  for (c = 0; c < columns.length; c += 1) {
    value = grid.getFooterCellText(columns[c]);
    xml.push(createExcelCell(rowIndex, c + 1, value, 'string', getExcelFooterCellStyle(columns[c])));
  }
  xml.push('</row>');
  return xml.join('');
}

function createSheetViewsXml(frozenColumns) {
  var topLeftCell = getExcelColumnName(frozenColumns + 1) + '2';
  var activePane = frozenColumns > 0 ? 'bottomRight' : 'bottomLeft';
  var pane = '<pane ySplit="1"';
  if (frozenColumns > 0) {
    pane += ' xSplit="' + frozenColumns + '"';
  }
  pane += ' topLeftCell="' + topLeftCell + '" activePane="' + activePane + '" state="frozen"/>';
  return '<sheetViews><sheetView workbookViewId="0">' + pane + '</sheetView></sheetViews>';
}

function createColumnWidthXml(columns) {
  var xml = [];
  var width;
  var i;
  if (!columns.length) {
    return '';
  }
  xml.push('<cols>');
  for (i = 0; i < columns.length; i += 1) {
    width = Math.max(8, Math.min(80, Math.round(exportToNumber(columns[i]._width || columns[i].width, 120) / 7)));
    xml.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + width + '" customWidth="1"' +
      (columns[i].visible === false ? ' hidden="1"' : '') + '/>');
  }
  xml.push('</cols>');
  return xml.join('');
}

function getExcelCellStyle(column, item, rowIndex, colIndex, options, registry, styleResolver) {
  var baseStyle = getExcelBaseCellStyle(column);
  var extraStyle = styleResolver(item, column, rowIndex, colIndex);
  if (extraStyle) {
    if (!extraStyle.align) {
      extraStyle.align = baseStyle.align;
    }
    if (!extraStyle.numFmtCode && !extraStyle.numberFormat && baseStyle.numFmtCode) {
      extraStyle.numFmtCode = baseStyle.numFmtCode;
    }
    return registerExcelCellStyle(registry, extraStyle);
  }
  if (baseStyle.numFmtCode) {
    return registerExcelCellStyle(registry, baseStyle);
  }
  if (baseStyle.id) {
    return baseStyle.id;
  }
  return 2;
}

function getExcelGroupCellStyle(column, isLabel, registry) {
  var baseStyle = getExcelBaseCellStyle(column);
  var style = {
    bold: isLabel,
    backgroundColor: 'FFE1E1E1',
    align: isLabel ? '' : baseStyle.align,
    numFmtCode: baseStyle.numFmtCode || ''
  };
  if (column.color) {
    style.color = cssColorToExcelColor(column.color);
  }
  return registerExcelCellStyle(registry, style);
}

function getExcelBaseCellStyle(column) {
  var numberFormat;
  if (column.align === 'right' || column.dataType === 'number') {
    numberFormat = getExcelNumberFormatCode(column);
    if (numberFormat) {
      return { align: 'right', numFmtCode: numberFormat };
    }
    return { id: 3, align: 'right' };
  }
  if (column.align === 'center' || column.dataType === 'boolean') {
    return { id: 4, align: 'center' };
  }
  return { id: 2, align: '' };
}

function getExcelFooterCellStyle(column) {
  if (column.align === 'right' || column.dataType === 'number') {
    return 3;
  }
  if (column.align === 'center' || column.dataType === 'boolean') {
    return 4;
  }
  return 2;
}

function getExcelNumberFormatCode(column) {
  var precision;
  var decimalPart = '';
  var integerPart;
  if (!column || column.dataType !== 'number') {
    return '';
  }
  precision = exportGetNumberPrecision(column);
  integerPart = exportShouldUseThousandsSeparator(column) ? '#,##0' : '0';
  if (precision != null) {
    decimalPart = precision > 0 ? '.' + repeatString('0', precision) : '';
  } else if (exportShouldUseThousandsSeparator(column)) {
    decimalPart = '.############';
  } else {
    return '';
  }
  return integerPart + decimalPart;
}

function repeatString(text, count) {
  var output = '';
  while (count > 0) {
    output += text;
    count -= 1;
  }
  return output;
}

function createExcelStyleResolver(options) {
  var sampleCell = null;
  var formatCell = options.formatCell;
  var customStyle = options.excelCellStyle;
  var grid = options.grid;
  var resolver;
  if (grid && grid.root && typeof document !== 'undefined' && typeof formatCell === 'function') {
    sampleCell = document.createElement('div');
    sampleCell.style.position = 'absolute';
    sampleCell.style.visibility = 'hidden';
    sampleCell.style.pointerEvents = 'none';
    sampleCell.style.top = '-10000px';
    sampleCell.style.left = '-10000px';
    grid.root.appendChild(sampleCell);
  }
  resolver = function(item, column, rowIndex, colIndex) {
    var value = exportGetByBinding(item, column.binding);
    var style = null;
    var fromCell;
    var override;
    if (sampleCell) {
      sampleCell.removeAttribute('style');
      sampleCell.style.position = 'absolute';
      sampleCell.style.visibility = 'hidden';
      sampleCell.style.pointerEvents = 'none';
      sampleCell.style.top = '-10000px';
      sampleCell.style.left = '-10000px';
      sampleCell.className = 'fg-cell' + (column.align ? ' fg-align-' + column.align : '');
      sampleCell.removeAttribute('data-row');
      sampleCell.removeAttribute('data-col');
      sampleCell.textContent = value == null ? '' : String(value);
      formatCell({
        grid: grid,
        cell: sampleCell,
        item: item,
        column: column,
        value: value,
        rowIndex: rowIndex,
        colIndex: colIndex
      });
      fromCell = getExcelStyleFromComputedCell(sampleCell);
      if (fromCell) {
        style = fromCell;
      }
    }
    if (typeof customStyle === 'function') {
      override = customStyle({
        grid: grid,
        item: item,
        column: column,
        value: value,
        rowIndex: rowIndex,
        colIndex: colIndex,
        style: style || {}
      });
      if (override) {
        style = mergeExcelStyle(style || {}, normalizeExcelStyle(override));
      }
    }
    return style;
  };
  if (sampleCell) {
    resolver.dispose = function() {
      if (sampleCell && sampleCell.parentNode) {
        sampleCell.parentNode.removeChild(sampleCell);
      }
    };
  }
  return resolver;
}

function getExcelStyleFromComputedCell(cell) {
  var computed = window.getComputedStyle(cell);
  var style = {};
  var color = cssColorToExcelColor(computed.color);
  var backgroundColor = cssColorToExcelColor(computed.backgroundColor);
  if (color && color !== 'FF1F2937' && color !== 'FF111827') {
    style.color = color;
  }
  if (backgroundColor && backgroundColor !== 'FFFFFFFF') {
    style.backgroundColor = backgroundColor;
  }
  if (Number(computed.fontWeight) >= 600 || computed.fontWeight === 'bold') {
    style.bold = true;
  }
  if (computed.textAlign === 'right' || computed.justifyContent === 'flex-end') {
    style.align = 'right';
  } else if (computed.textAlign === 'center' || computed.justifyContent === 'center') {
    style.align = 'center';
  }
  return Object.keys(style).length ? style : null;
}

export function createZip(files) {
  var localParts = [];
  var centralParts = [];
  var offset = 0;
  var i;
  var file;
  var data;
  var nameBytes;
  var crc;
  var dateParts = getZipDateParts(new Date());
  for (i = 0; i < files.length; i += 1) {
    file = files[i];
    data = stringToUtf8Bytes(file.content);
    nameBytes = stringToUtf8Bytes(file.name);
    crc = crc32(data);
    localParts.push(createZipLocalHeader(nameBytes, data, crc, dateParts));
    localParts.push(data);
    centralParts.push(createZipCentralHeader(nameBytes, data, crc, offset, dateParts));
    offset += localParts[localParts.length - 2].length + data.length;
  }
  return concatUint8Arrays(localParts.concat(centralParts, [
    createZipEndRecord(centralParts, offset)
  ]));
}

function createZipLocalHeader(nameBytes, data, crc, dateParts) {
  var header = new Uint8Array(30 + nameBytes.length);
  writeUint32(header, 0, 0x04034b50);
  writeUint16(header, 4, 20);
  writeUint16(header, 6, 2048);
  writeUint16(header, 8, 0);
  writeUint16(header, 10, dateParts.time);
  writeUint16(header, 12, dateParts.date);
  writeUint32(header, 14, crc);
  writeUint32(header, 18, data.length);
  writeUint32(header, 22, data.length);
  writeUint16(header, 26, nameBytes.length);
  writeUint16(header, 28, 0);
  header.set(nameBytes, 30);
  return header;
}

function createZipCentralHeader(nameBytes, data, crc, offset, dateParts) {
  var header = new Uint8Array(46 + nameBytes.length);
  writeUint32(header, 0, 0x02014b50);
  writeUint16(header, 4, 20);
  writeUint16(header, 6, 20);
  writeUint16(header, 8, 2048);
  writeUint16(header, 10, 0);
  writeUint16(header, 12, dateParts.time);
  writeUint16(header, 14, dateParts.date);
  writeUint32(header, 16, crc);
  writeUint32(header, 20, data.length);
  writeUint32(header, 24, data.length);
  writeUint16(header, 28, nameBytes.length);
  writeUint16(header, 30, 0);
  writeUint16(header, 32, 0);
  writeUint16(header, 34, 0);
  writeUint16(header, 36, 0);
  writeUint32(header, 38, 0);
  writeUint32(header, 42, offset);
  header.set(nameBytes, 46);
  return header;
}

function createZipEndRecord(centralParts, centralOffset) {
  var size = 0;
  var i;
  var header = new Uint8Array(22);
  for (i = 0; i < centralParts.length; i += 1) {
    size += centralParts[i].length;
  }
  writeUint32(header, 0, 0x06054b50);
  writeUint16(header, 8, centralParts.length);
  writeUint16(header, 10, centralParts.length);
  writeUint32(header, 12, size);
  writeUint32(header, 16, centralOffset);
  writeUint16(header, 20, 0);
  return header;
}

function getZipDateParts(date) {
  var year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function writeUint16(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
  bytes[offset + 2] = (value >>> 16) & 255;
  bytes[offset + 3] = (value >>> 24) & 255;
}

function stringToUtf8Bytes(text) {
  var encoded;
  var bytes;
  var i;
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  encoded = unescape(encodeURIComponent(text));
  bytes = new Uint8Array(encoded.length);
  for (i = 0; i < encoded.length; i += 1) {
    bytes[i] = encoded.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(parts) {
  var total = 0;
  var output;
  var offset = 0;
  var i;
  for (i = 0; i < parts.length; i += 1) {
    total += parts[i].length;
  }
  output = new Uint8Array(total);
  for (i = 0; i < parts.length; i += 1) {
    output.set(parts[i], offset);
    offset += parts[i].length;
  }
  return output;
}

function crc32(bytes) {
  var table = getCrcTable();
  var crc = -1;
  var i;
  for (i = 0; i < bytes.length; i += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 255];
  }
  return (crc ^ -1) >>> 0;
}

function getCrcTable() {
  var table = [];
  var c;
  var n;
  var k;
  if (getCrcTable.cache) {
    return getCrcTable.cache;
  }
  for (n = 0; n < 256; n += 1) {
    c = n;
    for (k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  getCrcTable.cache = table;
  return table;
}
