import ExcelJS from 'exceljs';

/**
 * פונקציות עזר לעיצוב אקסל אחיד
 */

// פונקציה בטוחה למיזוג תאים - בודקת שה.Cells קיימים ולא כבר ממוגגים
const safeMerge = (ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) => {
  const maxRow = ws.rowCount || 1;
  const maxCol = ws.columnCount || 1;
  const rr1 = Math.min(r1, maxRow);
  const cc1 = Math.min(c1, maxCol);
  const rr2 = Math.min(r2, maxRow);
  const cc2 = Math.min(c2, maxCol);
  if (rr1 === rr2 && cc1 === cc2) return;
  if (rr1 > rr2 || cc1 > cc2) return;
  try { ws.mergeCells(rr1, cc1, rr2, cc2); } catch (e) { console.warn('mergeCells skipped:', e); }
};

// סימולציית AutoFit - קביעת רוחבי עמודות לפי תוכן
const setSmartColumnWidths = (ws: ExcelJS.Worksheet, colWidths: Record<number, number>) => {
  Object.entries(colWidths).forEach(([col, width]) => {
    const c = Number(col);
    ws.getColumn(c).width = width;
    ws.getColumn(c).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
};

export const applyTableFormatting = (ws: ExcelJS.Worksheet, rows: number, cols: number) => {
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const cell = ws.getCell(r, c);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }
};

export const styleHeaderRow = (row: ExcelJS.Row, colCount: number) => {
  row.font = { bold: true, size: 12, name: 'Assistant', color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  row.height = 35;
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let i = 1; i <= colCount; i++) {
    row.getCell(i).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  }
};

export const styleDataRow = (row: ExcelJS.Row, colCount: number, isAlternate: boolean) => {
  row.font = { size: 11, name: 'Assistant' };
  row.height = 25;
  if (isAlternate) {
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF5FB' } };
  }
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  }
};

export const setNumericFormat = (ws: ExcelJS.Worksheet, col: number, startRow: number, endRow: number) => {
  for (let r = startRow; r <= endRow; r++) {
    const cell = ws.getCell(r, col);
    if (typeof cell.value === 'number') {
      cell.numFmt = '0.00';
    }
  }
};

export const setCurrencyFormat = (ws: ExcelJS.Worksheet, col: number, startRow: number, endRow: number) => {
  for (let r = startRow; r <= endRow; r++) {
    const cell = ws.getCell(r, col);
    cell.numFmt = '₪#,##0.00';
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
  }
};

// פונקציה לפיצול כותרות עם סוגריים
export const formatHeaderTitle = (title: string) => {
  return title.replace(/\s*(\([^)]+\))$/, '\n$1');
};

/**
 * החלת לוגו וכותרת על גיליון אקסל
 * לוגו בצד ימין (5 עמודות × 2.5 שורות), כותרת ממוזגת על כל העמודות
 * שורה 3: לקוח (1-3) ימין | פרויקט (4-7) שמאל | תאריך (אחרון) שמאל
 */
export const applyLogoAndHeader = (
  ws: ExcelJS.Worksheet,
  logoImageId: number | undefined,
  title: string,
  clientName: string,
  projectName: string,
  docDate: string,
  cols: number
) => {
  // Row 1-2: Logo on right side (5 columns wide × 2.5 rows high)
  ws.getRow(1).height = 50;
  ws.getRow(2).height = 50;
  if (logoImageId !== undefined) {
    try {
      const logoStartCol = Math.max(1, cols - 4);
      ws.addImage(logoImageId, {
        tl: { col: logoStartCol - 1, row: 0 },
        ext: { width: 400, height: 120 }
      });
    } catch (e) { console.warn('Logo placement failed:', e); }
  }

  // Row 3: Title
  ws.mergeCells(3, 1, 3, cols);
  const titleRow = ws.getRow(3);
  titleRow.getCell(1).value = title;
  titleRow.font = { bold: true, size: 14, name: 'Assistant' };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 30;

  // Row 4: Info Row - customer right, project middle, date left
  ws.getRow(4).height = 22;

  // Client: cols 1-3, right-aligned
  if (cols >= 3) safeMerge(ws, 4, 1, 4, 3);
  const clientCell = ws.getRow(4).getCell(1);
  clientCell.value = `לקוח: ${clientName || 'לא נבחר'}`;
  clientCell.font = { size: 11, bold: true, name: 'Assistant' };
  clientCell.alignment = { horizontal: 'right', vertical: 'middle' };

  // Project: cols 4-7 (or middle), left-aligned
  const projEnd = Math.min(cols - 1, 7);
  if (projEnd >= 4) safeMerge(ws, 4, 4, 4, projEnd);
  const projCell = ws.getRow(4).getCell(4);
  projCell.value = `פרויקט: ${projectName || 'לא נבחר'}`;
  projCell.font = { size: 11, bold: true, name: 'Assistant' };
  projCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Date: last column, left-aligned
  const dateCell = ws.getRow(4).getCell(cols);
  dateCell.value = `תאריך: ${docDate}`;
  dateCell.font = { size: 11, bold: true, name: 'Assistant' };
  dateCell.alignment = { horizontal: 'left', vertical: 'middle' };
};

export const addSumFormula = (ws: ExcelJS.Worksheet, row: ExcelJS.Row, colIndex: number, firstDataRow: number, lastDataRow: number) => {
  if (firstDataRow > lastDataRow) return;
  const colLetter = ws.getColumn(colIndex).letter;
  const cell = row.getCell(colIndex);
  cell.value = { formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})` };
  cell.font = { bold: true, name: 'Assistant' };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.numFmt = '0.00';
  cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
};

/**
 * יישור טקסט לימין בעמודות מסויימות
 */
export const alignColumnsRight = (ws: ExcelJS.Worksheet, cols: number[], startRow: number, endRow: number) => {
  for (const c of cols) {
    for (let r = startRow; r <= endRow; r++) {
      ws.getCell(r, c).alignment = { horizontal: 'right', vertical: 'middle' };
    }
  }
};
