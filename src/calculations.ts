import type { RowData, Sheet, PriceItem } from './App';

// ──────────────────────────────────────────────
// חישובים טהורים — ללא תלויות React
// ──────────────────────────────────────────────

export const calculateThickness = (w1: number, h1: number, manual?: number): number => {
  if (manual && manual > 0) return manual;
  const max = Math.max(w1, h1);
  if (max <= 600) return 0.8;
  if (max <= 1000) return 1.0;
  return 1.25;
};

export const calculateArea = (row: RowData): number => {
  const { type, width1, height1, width2, height2, length, rBig, rSmall, notes, rBig2, dofan = 0 } = row;
  const panels = row.panels || 1;

  if (notes && notes.includes('צינור עגול')) {
    return (Math.PI * width1 * length);
  }

  if (notes === 'לאמד S') {
    const r2 = rBig2 || rSmall;
    const totalLen = length + (Math.PI / 2) * (rSmall + r2);
    return (2 * (width1 + height1) * totalLen);
  }

  let areaBeforePanels = 0;
  if (type === 'קטע ישר') areaBeforePanels = 2 * (width1 + height1) * length;
  else if (type === 'קשת') areaBeforePanels = 2 * (width1 + height1) * (rBig + rSmall);
  else if (type === 'מעבר') areaBeforePanels = ((width1 + width2) + (height1 + height2)) * length;

  const dofanArea = dofan * width1 * height1;
  return ((areaBeforePanels + dofanArea) * panels);
};

export const getPrice = (name: string, pricesList: PriceItem[]): number => {
  const item = pricesList.find(p => p.detail === name);
  return item ? item.price : 0;
};

export const getRowWarnings = (row: RowData): string[] => {
  const warnings: string[] = [];
  if (row.length > 6) warnings.push('אורך מעל 6 מטר');
  if (row.type !== 'קשת' && row.length > 0 && row.length < 0.05) warnings.push('אורך קצר מאוד');
  if (row.width1 > 2 || row.height1 > 2) warnings.push('מידות חריגות');
  if (row.type === 'מעבר' && row.width2 > 0 && row.height2 > 0) {
    const ratio = Math.max(row.width1, row.height1) / Math.max(row.width2, row.height2);
    if (ratio > 3 || ratio < 0.33) warnings.push('יחס מעבר חריג');
  }
  return warnings;
};

export const getDetailedSheetCosts = (sheet: Sheet, pricesList: PriceItem[]) => {
  let sheetPahSum = 0;
  let sheetPah125Sum = 0;
  let sheetBidudSum = 0;
  let sheetMatamSum = 0;
  let sheetShatuzarSum = 0;
  let sheetFlexibleSum = 0;
  let sheetSharshuriSum = 0;

  sheet.rows.forEach(row => {
    const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
    const area = calculateArea(row);

    if (thick === 0.8) sheetPahSum += area * getPrice('פח 0.8', pricesList);
    else if (thick === 1.0) sheetPahSum += area * getPrice('פח 1.0', pricesList);
    else if (thick === 1.25) sheetPah125Sum += area * getPrice('פח 1.25', pricesList);

    if (row.acoustic) sheetBidudSum += (area / (row.panels || 1)) * getPrice('בידוד פנימי 1"', pricesList);
    if (row.external) sheetBidudSum += area * getPrice('בידוד חיצוני 1"', pricesList);

    if (row.adapterType !== 'ללא' && row.adapterQty > 0) {
      let adapterPriceKey = 'מתאם 6"6/"';
      if (row.adapterType === '8/8 מתאם') adapterPriceKey = 'מתאם 8"8/"';
      else if (row.adapterType === '10/10 מתאם') adapterPriceKey = 'מתאם 10"10/"';
      else if (row.adapterType === '12/12 מתאם') adapterPriceKey = 'מתאם 12"12/"';
      else if (row.adapterType === '14/14 מתאם') adapterPriceKey = 'מתאם 14"14/"';
      else if (row.adapterType === '16/16 מתאם') adapterPriceKey = 'מתאם 16"16/"';
      else if (row.adapterType === '60/60 מתאם') adapterPriceKey = 'מתאם 60/60';
      sheetMatamSum += row.adapterQty * getPrice(adapterPriceKey, pricesList);
    }

    if (row.shatuzar) sheetShatuzarSum += 1 * getPrice('שתוצר עגול', pricesList);

    if (row.flexible > 0 && row.length > 0) {
      sheetFlexibleSum += row.flexible * row.length * getPrice('חיבור גמיש', pricesList);
    }

    if (row.sharshuriType !== 'ללא' && row.length > 0) {
      let sharshuriPriceKey = 'שרשורי 6"';
      if (row.sharshuriType === '"4') sharshuriPriceKey = 'שרשורי 4"';
      else if (row.sharshuriType === '"8') sharshuriPriceKey = 'שרשורי 8"';
      else if (row.sharshuriType === '"10') sharshuriPriceKey = 'שרשורי 10"';
      else if (row.sharshuriType === '"12') sharshuriPriceKey = 'שרשורי 12"';
      else if (row.sharshuriType === '"14') sharshuriPriceKey = 'שרשורי 14"';
      sheetSharshuriSum += row.length * getPrice(sharshuriPriceKey, pricesList);
    }
  });

  const subtotal = sheetPahSum + sheetPah125Sum + sheetBidudSum + sheetMatamSum + sheetShatuzarSum + sheetFlexibleSum + sheetSharshuriSum;
  const vat = subtotal * 0.18;
  const total = subtotal + vat;

  return { pahCost: sheetPahSum, pah125Cost: sheetPah125Sum, bidudCost: sheetBidudSum, matamCost: sheetMatamSum, shatuzarCost: sheetShatuzarSum, flexibleCost: sheetFlexibleSum, sharshuriCost: sheetSharshuriSum, subtotal, vat, total };
};

export const getProjectTotals = (sheets: Sheet[], pricesList: PriceItem[]) => {
  let t08 = 0; let t10 = 0; let t125 = 0;
  let totalShatuzar = 0; let totalFlexible = 0;
  let totalAcousticArea = 0; let totalExternalArea = 0;
  const sharshuriTotals: Record<string, number> = { '"4': 0, '"6': 0, '"8': 0, '"10': 0, '"12': 0, '"14': 0 };
  const adapterTotals: Record<string, number> = { '"6 מתאם': 0, '8/8 מתאם': 0, '10/10 מתאם': 0, '12/12 מתאם': 0, '14/14 מתאם': 0, '16/16 מתאם': 0, '60/60 מתאם': 0 };

  sheets.forEach(sheet => {
    sheet.rows.forEach(row => {
      const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
      const area = calculateArea(row);
      if (thick === 0.8) t08 += area;
      else if (thick === 1.0) t10 += area;
      else if (thick === 1.25) t125 += area;
      if (row.shatuzar) totalShatuzar += 1;
      if (row.flexible && row.length) totalFlexible += row.flexible * row.length;
      if (row.acoustic) totalAcousticArea += area;
      if (row.external) totalExternalArea += area;
      if (row.sharshuriType !== 'ללא') sharshuriTotals[row.sharshuriType] += row.length;
      if (row.adapterType !== 'ללא') adapterTotals[row.adapterType] += row.adapterQty;
    });
  });

  return { 0.8: t08, 1.0: t10, 1.25: t125, shatuzar: totalShatuzar, flexible: totalFlexible, acoustic: totalAcousticArea, external: totalExternalArea, sharshuri: sharshuriTotals, adapter: adapterTotals };
};

export const getSubtotal = (sheets: Sheet[], pricesList: PriceItem[]) => {
  return sheets.reduce((sum, sheet) => sum + getDetailedSheetCosts(sheet, pricesList).subtotal, 0);
};

export const getSheetTotals = (sheet: Sheet) => {
  let t08 = 0; let t10 = 0; let t125 = 0;
  let flexible = 0; let acoustic = 0; let external = 0;
  let sharshuri4 = 0; let sharshuri6 = 0; let sharshuri8 = 0; let sharshuri10 = 0; let sharshuri12 = 0; let sharshuri14 = 0;
  let adapterQty = 0; let shatuzar = 0;

  sheet.rows.forEach(row => {
    const thick = calculateThickness(row.width1, row.height1, row.manualThickness);
    const area = calculateArea(row);
    if (thick === 0.8) t08 += area;
    else if (thick === 1.0) t10 += area;
    else if (thick === 1.25) t125 += area;
    if (row.flexible && row.length) flexible += row.flexible * row.length;
    if (row.acoustic) acoustic += area;
    if (row.external) external += area;
    if (row.sharshuriType === '"4') sharshuri4 += row.length;
    else if (row.sharshuriType === '"6') sharshuri6 += row.length;
    else if (row.sharshuriType === '"8') sharshuri8 += row.length;
    else if (row.sharshuriType === '"10') sharshuri10 += row.length;
    else if (row.sharshuriType === '"12') sharshuri12 += row.length;
    else if (row.sharshuriType === '"14') sharshuri14 += row.length;
    if (row.adapterType !== 'ללא') adapterQty += row.adapterQty;
    if (row.type === 'שתוצר') shatuzar += (row.panels || 1);
    else if (row.shatuzar) shatuzar += 1;
  });

  return { t08, t10, t125, flexible, acoustic, external, sharshuri4, sharshuri6, sharshuri8, sharshuri10, sharshuri12, sharshuri14, adapterQty, shatuzar };
};
