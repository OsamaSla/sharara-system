import type { PriceItem, FormulaConfig } from './types';

// ──────────────────────────────────────────────
// נתוני ברירת מחדל — לקוחות, מחירים, פרטי חברה
// ──────────────────────────────────────────────

export const EXISTING_DATA: Record<string, { phone: string; email: string; contact: string; regDate: string; projects: string[] }> = {
  "אלקטרה מיזוג אוויר": {
    phone: "03-9404040", email: "info@electra.co.il", contact: "יוסי לוי", regDate: "2025-01-10",
    projects: ["מגדלי עזריאלי קומה 4", "בית חולים שיבא - מחלקה ד'"]
  },
  "תדיראן פרויקטים": {
    phone: "04-8203030", email: "pro@tadiran.co.il", contact: "אבי כהן", regDate: "2025-03-15",
    projects: ["קניון עופר פתח תקווה", "משרדי הייטק הרצליה"]
  },
  "משב הנדסה": {
    phone: "02-5607080", email: "mashav@mashav.co.il", contact: "רוני לוין", regDate: "2025-06-01",
    projects: ["מגדל פלטינום תל אביב"]
  }
};

export const DEFAULT_PRICES: PriceItem[] = [
  { id: "1", detail: 'פח 0.7', unit: 'מ"ר', price: 100 },
  { id: "2", detail: 'פח 0.8', unit: 'מ"ר', price: 105 },
  { id: "3", detail: 'פח 0.9', unit: 'מ"ר', price: 110 },
  { id: "4", detail: 'פח 1.0', unit: 'מ"ר', price: 140 },
  { id: "5", detail: 'פח 1.25', unit: 'מ"ר', price: 160 },
  { id: "6", detail: 'פח שחור 2מ"מ', unit: 'מ"ר', price: 420 },
  { id: "7", detail: 'התקנת פתח גישה', unit: 'יחידה', price: 200 },
  { id: "8", detail: 'בידוד פנימי 1"', unit: 'מ"ר', price: 45 },
  { id: "9", detail: 'בידוד פנימי 2"', unit: 'מ"ר', price: 90 },
  { id: "10", detail: 'בידוד חיצוני 1"', unit: 'מ"ר', price: 45 },
  { id: "11", detail: 'בידוד חיצוני 2"', unit: 'מ"ר', price: 90 },
  { id: "12", detail: 'בידוד קרמי', unit: 'מ"ר', price: 450 },
  { id: "13", detail: 'חיבור גמיש', unit: 'מ"א', price: 90 },
  { id: "14", detail: 'שתוצר עגול', unit: 'יחידה', price: 50 },
  { id: "15", detail: 'שרשורי 4"', unit: 'מ"א', price: 50 },
  { id: "16", detail: 'שרשורי 6"', unit: 'מ"א', price: 60 },
  { id: "17", detail: 'שרשורי 8"', unit: 'מ"א', price: 70 },
  { id: "18", detail: 'שרשורי 10"', unit: 'מ"א', price: 80 },
  { id: "19", detail: 'שרשורי 12"', unit: 'מ"א', price: 90 },
  { id: "20", detail: 'שרשורי 14"', unit: 'מ"א', price: 100 },
  { id: "21", detail: 'דמפר עגול עד 10"', unit: 'יחידה', price: 125 },
  { id: "22", unit: 'יחידה', detail: 'קופסת ניפוח', price: 250 },
  { id: "23", unit: 'מ"ר', detail: 'חיבור אוגנים', price: 25 },
  { id: "24", unit: 'מ"ר', detail: 'תעלות ספירקל', price: 205 },
  { id: "25", unit: 'מ"ר', detail: 'צבע', price: 50 },
  { id: "26", unit: 'מ"ר', detail: 'איטום', price: 20 },
  { id: "27", unit: 'יחידה', detail: 'התקנת דמפר אש/ווסות', price: 200 },
  { id: "28", unit: 'יחידה', detail: 'מתאם 6"6/"', price: 60 },
  { id: "29", unit: 'יחידה', detail: 'מתאם 8"8/"', price: 80 },
  { id: "30", unit: 'יחידה', detail: 'מתאם 10"10/"', price: 100 },
  { id: "31", unit: 'יחידה', detail: 'מתאם 12"12/"', price: 110 },
  { id: "32", unit: 'יחידה', detail: 'מתאם 14"14/"', price: 120 },
  { id: "33", unit: 'יחידה', detail: 'מתאם 16"16/"', price: 140 },
  { id: "34", unit: 'יחידה', detail: 'מתאם 60/60', price: 180 },
  { id: "35", unit: 'יחידה', detail: 'התקנת מפוח', price: 400 },
  { id: "36", unit: 'יחידה', detail: 'התקנת משתיק', price: 250 }
];

export const DEFAULT_COMPANY = {
  name: 'עלי שרארה בע"מ',
  engName: 'Sharara 1970',
  subtitle: 'תעשיות פח ומערכות אוורור ומיזוג אוויר',
  website: 'www.sharara.co.il',
  email: 'info@sharara.co.il',
  address: 'אזור תעשייה, נצרת עילית (ריינה) ת.ד. 4174',
  phone: '04-6082264',
  fax: '04-6082263',
  mobile: '053-5819466',
  pobox: '4040/4 שכ\' מזרחית מיקוד 16000',
  services: [
    'תכנון וביצוע מערכות מיזוג אוויר ואוורור',
    'פינוי עשן',
    'ייצור תעלות פח',
    'צינורות "ספיראל" ואביזרים',
    'תעלות נירוסטה ומנדפים',
    'תעלות פח שחור',
    'חיתוך וכיפוף פחים',
    'מכירה והתקנת כל סוגי המזגנים'
  ],
  serviceLines: [
    'תכנון וביצוע מערכות מיזוג אוויר ואוורור * פינוי עשן * ייצור תעלות פח',
    'צינורות "ספיראל" ואביזרים * תעלות נירוסטה ומנדפים * תעלות',
    'פח שחור * חיתוך וכיפוף פחים * מכירה והתקנת כל סוגי המזגנים',
  ]
};

export const DEFAULT_ROW = {
  id: '', partNumber: '', type: 'קטע ישר' as const, width1: 0.5, height1: 0.4, width2: 0, height2: 0,
  length: 1.0, rBig: 0, rSmall: 0, shatuzar: false, flexible: 0, acoustic: true, external: false,
  sharshuriType: 'ללא' as const, sharshuriLen: 0, adapterType: 'ללא' as const, adapterQty: 0,
  notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0,
  productionMode: 'automatic' as const, productionOverrides: {}
};

export const DEFAULT_SHEET = {
  id: '1',
  name: 'דף מדידה #1',
  rows: [
    { id: '1', partNumber: 'P001', type: 'קטע ישר' as const, width1: 0.5, height1: 0.4, width2: 0, height2: 0, length: 1.0, rBig: 0, rSmall: 0, shatuzar: false, flexible: 0, acoustic: true, external: false, sharshuriType: 'ללא' as const, sharshuriLen: 0, adapterType: 'ללא' as const, adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0, productionMode: 'automatic' as const, productionOverrides: {} },
    { id: '2', partNumber: 'P002', type: 'קשת' as const, width1: 0.5, height1: 0.4, width2: 0, height2: 0, length: 0, rBig: 0.6, rSmall: 0.1, shatuzar: false, flexible: 0, acoustic: false, external: false, sharshuriType: 'ללא' as const, sharshuriLen: 0, adapterType: 'ללא' as const, adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0, productionMode: 'automatic' as const, productionOverrides: {} },
    { id: '3', partNumber: 'P003', type: 'מעבר' as const, width1: 0.5, height1: 0.4, width2: 0.3, height2: 0.2, length: 0.5, rBig: 0, rSmall: 0, shatuzar: false, flexible: 0, acoustic: false, external: false, sharshuriType: 'ללא' as const, sharshuriLen: 0, adapterType: 'ללא' as const, adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0, productionMode: 'automatic' as const, productionOverrides: {} },
    { id: '4', partNumber: 'P004', type: 'שתוצר' as const, width1: 0.5, height1: 0.4, width2: 0, height2: 0, length: 0.3, rBig: 0, rSmall: 0, shatuzar: true, flexible: 0, acoustic: false, external: false, sharshuriType: 'ללא' as const, sharshuriLen: 0, adapterType: 'ללא' as const, adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0, productionMode: 'automatic' as const, productionOverrides: {} },
    { id: '5', partNumber: 'P005', type: 'מתאם' as const, width1: 0.3, height1: 0.3, width2: 0, height2: 0, length: 0, rBig: 0, rSmall: 0, shatuzar: false, flexible: 0, acoustic: false, external: false, sharshuriType: 'ללא' as const, sharshuriLen: 0, adapterType: '8/8 מתאם' as const, adapterQty: 2, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0, productionMode: 'automatic' as const, productionOverrides: {} },
    { id: '6', partNumber: 'P006', type: 'שרשורי' as const, width1: 0, height1: 0, width2: 0, height2: 0, length: 2.5, rBig: 0, rSmall: 0, shatuzar: false, flexible: 0, acoustic: false, external: false, sharshuriType: '"8' as const, sharshuriLen: 0, adapterType: 'ללא' as const, adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0, productionMode: 'automatic' as const, productionOverrides: {} },
    { id: '7', partNumber: 'P007', type: 'חיבור גמיש' as const, width1: 0.3, height1: 0.3, width2: 0, height2: 0, length: 0.8, rBig: 0, rSmall: 0, shatuzar: false, flexible: 2, acoustic: false, external: false, sharshuriType: 'ללא' as const, sharshuriLen: 0, adapterType: 'ללא' as const, adapterQty: 0, notes: '', manualThickness: 0, rBig2: 0, panels: 0, dofan: 0, productionMode: 'automatic' as const, productionOverrides: {} },
  ]
};

export const DEFAULT_FORMULAS: FormulaConfig = {
  'קטע ישר': '2 * (width1 + height1) * length',
  'קשת': '2 * (width1 + height1) * (rBig + rSmall)',
  'מעבר': '((width1 + width2) + (height1 + height2)) * length',
  'שתוצר': '0',
  'מתאם': '0',
  'שרשורי': '0',
  'חיבור גמיש': '0',
  'צינור עגול': '(PI * width1 * length) + (dofan * width1 * height1)',
  'לאמד S': '2 * (width1 + height1) * (length + (PI / 2) * (rSmall + rBig2))',
};
