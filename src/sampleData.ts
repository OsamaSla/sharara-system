// ──────────────────────────────────────────────
// דוגמת נתונים — פרויקט מדידה שלם עם כל סוגי החלקים
// ──────────────────────────────────────────────

let _id = 100;
const uid = () => String(++_id);

// ─── Part factories ───
const row = (overrides: Record<string, any>): Record<string, any> => ({
  id: uid(), partNumber: '', type: 'קטע ישר',
  width1: 0.5, height1: 0.4, width2: 0, height2: 0, length: 1.0,
  rBig: 0, rSmall: 0, shatuzar: false, flexible: 0,
  acoustic: true, external: false,
  sharshuriType: 'ללא', sharshuriLen: 0,
  adapterType: 'ללא', adapterQty: 0,
  notes: '', manualThickness: 0, rBig2: 0,
  panels: 0, dofan: 0,
  productionMode: 'automatic', productionOverrides: {},
  ...overrides,
});

// ──────────────────────────────────────────────
// Sheet 1: קומות משרדים — תעלות מלבניות
// ──────────────────────────────────────────────
const sheet1Rows = [
  // קטעים ישרים — גדלים שונים
  row({ partNumber: 'P001', type: 'קטע ישר', width1: 1.0, height1: 0.5, length: 3.0, acoustic: true, external: false, panels: 2, notes: 'מעבר למשרד' }),
  row({ partNumber: 'P002', type: 'קטע ישר', width1: 0.8, height1: 0.4, length: 2.5, acoustic: false, external: false, panels: 2, dofan: 1 }),
  row({ partNumber: 'P003', type: 'קטע ישר', width1: 0.6, height1: 0.3, length: 1.5, acoustic: false, external: false, panels: 2 }),
  row({ partNumber: 'P004', type: 'קטע ישר', width1: 1.2, height1: 0.6, length: 2.0, acoustic: true, external: true, panels: 4, notes: 'בידוד כפול' }),
  row({ partNumber: 'P005', type: 'קטע ישר', width1: 0.5, height1: 0.25, length: 1.8, acoustic: false, external: false, panels: 2 }),
  row({ partNumber: 'P006', type: 'קטע ישר', width1: 0.4, height1: 0.2, length: 1.2, acoustic: false, external: false, panels: 2 }),
  row({ partNumber: 'P007', type: 'קטע ישר', width1: 0.8, height1: 0.8, length: 0.8, acoustic: true, external: false, panels: 4 }),
  row({ partNumber: 'P008', type: 'קטע ישר', width1: 1.5, height1: 0.5, length: 2.0, acoustic: true, external: true, panels: 2 }),

  // קשתות
  row({ partNumber: 'P009', type: 'קשת', width1: 1.0, height1: 0.5, rSmall: 0.25, rBig: 1.25, length: 0, acoustic: true, external: false }),
  row({ partNumber: 'P010', type: 'קשת', width1: 0.8, height1: 0.4, rSmall: 0.20, rBig: 1.0, length: 0, acoustic: false, external: false }),
  row({ partNumber: 'P011', type: 'קשת', width1: 0.6, height1: 0.3, rSmall: 0.15, rBig: 0.75, length: 0, acoustic: false, external: false }),
  row({ partNumber: 'P012', type: 'קשת', width1: 1.2, height1: 0.6, rSmall: 0.30, rBig: 1.5, length: 0, acoustic: false, external: true }),

  // מעברים (גדלים שונים)
  row({ partNumber: 'P013', type: 'מעבר', width1: 1.0, height1: 0.5, width2: 0.8, height2: 0.4, length: 0.6, acoustic: false, external: false }),
  row({ partNumber: 'P014', type: 'מעבר', width1: 0.8, height1: 0.4, width2: 0.6, height2: 0.3, length: 0.5, acoustic: false, external: false }),
  row({ partNumber: 'P015', type: 'מעבר', width1: 1.2, height1: 0.6, width2: 0.6, height2: 0.3, length: 0.8, acoustic: true, external: false }),
  row({ partNumber: 'P016', type: 'מעבר', width1: 1.0, height1: 0.5, width2: 0.5, height2: 0.25, length: 0.6, acoustic: false, external: false }),

  // שתוצר
  row({ partNumber: 'P017', type: 'שתוצר', width1: 0.5, height1: 0.4, length: 0.3, shatuzar: true, acoustic: false, external: false }),
  row({ partNumber: 'P018', type: 'שתוצר', width1: 0.8, height1: 0.4, length: 0.3, shatuzar: true, acoustic: false, external: false }),
  row({ partNumber: 'P019', type: 'שתוצר', width1: 0.6, height1: 0.3, length: 0.3, shatuzar: true, acoustic: false, external: false }),

  // Special parts
  row({ partNumber: 'P020', type: 'קטע ישר', width1: 0.5, height1: 0.25, length: 2.0, notes: 'לאמד S', rSmall: 0.15, rBig2: 0.10 }),
  row({ partNumber: 'P021', type: 'קטע ישר', width1: 0.0, height1: 0.0, length: 1.5, notes: 'צינור עגול', panels: 0 }),
];

// ──────────────────────────────────────────────
// Sheet 2: מטבח / שירותים — תעלות עגולות + אביזרים
// ──────────────────────────────────────────────
const sheet2Rows = [
  row({ partNumber: 'M001', type: 'קטע ישר', width1: 0.3, height1: 0.3, length: 1.0, notes: 'צינור עגול' }),
  row({ partNumber: 'M002', type: 'קטע ישר', width1: 0.25, height1: 0.25, length: 0.8, notes: 'צינור עגול' }),
  row({ partNumber: 'M003', type: 'קשת', width1: 0.3, height1: 0.3, rSmall: 0.15, rBig: 0.45, length: 0, notes: 'צינור עגול' }),
  row({ partNumber: 'M004', type: 'מעבר', width1: 0.3, height1: 0.3, width2: 0.25, height2: 0.25, length: 0.4, notes: 'צינור עגול' }),
  row({ partNumber: 'M005', type: 'קטע ישר', width1: 0.2, height1: 0.2, length: 1.2, notes: 'קופסת פיזור', panels: 4, dofan: 2 }),
  row({ partNumber: 'M006', type: 'קטע ישר', width1: 0.15, height1: 0.15, length: 0.6, notes: 'צינור עגול' }),

  // אביזרים
  row({ partNumber: 'A001', type: 'חיבור גמיש', width1: 0.3, height1: 0.3, length: 0.8, flexible: 2 }),
  row({ partNumber: 'A002', type: 'חיבור גמיש', width1: 0.25, height1: 0.25, length: 0.6, flexible: 1 }),
  row({ partNumber: 'A003', type: 'שרשורי', sharshuriType: '"8', length: 2.5 }),
  row({ partNumber: 'A004', type: 'שרשורי', sharshuriType: '"6', length: 3.0 }),
  row({ partNumber: 'A005', type: 'שרשורי', sharshuriType: '"10', length: 2.0 }),
  row({ partNumber: 'A006', type: 'שרשורי', sharshuriType: '"4', length: 1.5 }),
  row({ partNumber: 'A007', type: 'מתאם', width1: 0.3, height1: 0.3, adapterType: '8/8 מתאם', adapterQty: 2 }),
  row({ partNumber: 'A008', type: 'מתאם', width1: 0.25, height1: 0.25, adapterType: '"6 מתאם', adapterQty: 3 }),
  row({ partNumber: 'A009', type: 'מתאם', width1: 0.4, height1: 0.4, adapterType: '10/10 מתאם', adapterQty: 1 }),
];

// ──────────────────────────────────────────────
// Sheet 3: קומת מגורים —.parts + מדף אש + קופסת פיזור
// ──────────────────────────────────────────────
const sheet3Rows = [
  row({ partNumber: 'R001', type: 'קטע ישר', width1: 0.4, height1: 0.2, length: 2.0, acoustic: false, external: false, panels: 2 }),
  row({ partNumber: 'R002', type: 'קטע ישר', width1: 0.35, height1: 0.2, length: 1.5, acoustic: false, external: false, panels: 2 }),
  row({ partNumber: 'R003', type: 'קשת', width1: 0.4, height1: 0.2, rSmall: 0.10, rBig: 0.50, length: 0 }),
  row({ partNumber: 'R004', type: 'מעבר', width1: 0.4, height1: 0.2, width2: 0.35, height2: 0.2, length: 0.4 }),
  row({ partNumber: 'R005', type: 'קטע ישר', width1: 0.6, height1: 0.3, length: 3.0, acoustic: true, external: false, panels: 2, dofan: 1 }),
  row({ partNumber: 'R006', type: 'קטע ישר', width1: 0.5, height1: 0.25, length: 2.5, acoustic: false, external: false, panels: 2 }),
  row({ partNumber: 'R007', type: 'קשת', width1: 0.6, height1: 0.3, rSmall: 0.15, rBig: 0.75, length: 0 }),
  row({ partNumber: 'R008', type: 'מעבר', width1: 0.6, height1: 0.3, width2: 0.5, height2: 0.25, length: 0.5 }),
  row({ partNumber: 'R009', type: 'שתוצר', width1: 0.4, height1: 0.2, length: 0.3, shatuzar: true }),
  row({ partNumber: 'R010', type: 'שתוצר', width1: 0.35, height1: 0.2, length: 0.3, shatuzar: true }),

  // Special parts
  row({ partNumber: 'R011', type: 'קטע ישר', width1: 0.4, height1: 0.2, length: 1.0, notes: 'מדף אש', panels: 2 }),
  row({ partNumber: 'R012', type: 'קטע ישר', width1: 0.0, height1: 0.0, length: 0.8, notes: 'קופסת פיזור', panels: 4, dofan: 4 }),

  // Accessory parts
  row({ partNumber: 'RA01', type: 'חיבור גמיש', width1: 0.4, height1: 0.2, length: 0.6, flexible: 2 }),
  row({ partNumber: 'RA02', type: 'שרשורי', sharshuriType: '"6', length: 2.0 }),
  row({ partNumber: 'RA03', type: 'שרשורי', sharshuriType: '"8', length: 2.5 }),
  row({ partNumber: 'RA04', type: 'שרשורי', sharshuriType: '"12', length: 1.8 }),
  row({ partNumber: 'RA05', type: 'שרשורי', sharshuriType: '"14', length: 2.2 }),
  row({ partNumber: 'RA06', type: 'מתאם', width1: 0.4, height1: 0.4, adapterType: '12/12 מתאם', adapterQty: 1 }),
  row({ partNumber: 'RA07', type: 'מתאם', width1: 0.5, height1: 0.5, adapterType: '14/14 מתאם', adapterQty: 1 }),
  row({ partNumber: 'RA08', type: 'מתאם', width1: 0.6, height1: 0.6, adapterType: '16/16 מתאם', adapterQty: 2 }),
];

// ──────────────────────────────────────────────
// Sample sheets
// ──────────────────────────────────────────────
export const SAMPLE_SHEETS = [
  { id: 's1', name: 'קומה 4 — משרדים', rows: sheet1Rows },
  { id: 's2', name: 'מטבח + שירותים', rows: sheet2Rows },
  { id: 's3', name: 'קומת מגורים', rows: sheet3Rows },
];

// ──────────────────────────────────────────────
// Sample clients
// ──────────────────────────────────────────────
export const SAMPLE_CLIENTS: Record<string, {
  phone: string; email: string; contact: string; regDate: string; projects: string[];
}> = {
  'אלקטרה מיזוג אוויר': {
    phone: '03-9404040', email: 'info@electra.co.il', contact: 'יוסי לוי', regDate: '2025-01-10',
    projects: ['מגדלי עזריאלי קומה 4', 'בית חולים שיבא - מחלקה ד\''],
  },
  'תדיראן פרויקטים': {
    phone: '04-8203030', email: 'pro@tadiran.co.il', contact: 'אבי כהן', regDate: '2025-03-15',
    projects: ['קניון עופר פתח תקווה', 'משרדי הייטק הרצליה'],
  },
  'משב הנדסה': {
    phone: '02-5607080', email: 'mashav@mashav.co.il', contact: 'רוני לוין', regDate: '2025-06-01',
    projects: ['מגדל פלטינום תל אביב'],
  },
};

export const SAMPLE_DOC_NUMBERS: Record<string, string> = {
  'אלקטרה מיזוג אוויר-מגדלי עזריאלי קומה 4': '1001',
  'אלקטרה מיזוג אוויר-בית חולים שיבא - מחלקה ד\'': '1002',
  'תדיראן פרויקטים-קניון עופר פתח תקווה': '2001',
  'תדיראן פרויקטים-משרדי הייטק הרצליה': '2002',
  'משב הנדסה-מגדל פלטינום תל אביב': '3001',
};

export const SAMPLE_DOC_DATES: Record<string, string> = {
  'אלקטרה מיזוג אוויר-מגדלי עזריאלי קומה 4': '2026-06-20',
  'אלקטרה מיזוג אוויר-בית חולים שיבא - מחלקה ד\'': '2026-06-18',
  'תדיראן פרויקטים-קניון עופר פתח תקווה': '2026-06-15',
  'תדיראן פרויקטים-משרדי הייטק הרצליה': '2026-06-19',
  'משב הנדסה-מגדל פלטינום תל אביב': '2026-06-20',
};

// ──────────────────────────────────────────────
// Export full snapshot (all data together)
// ──────────────────────────────────────────────
export const SAMPLE_SNAPSHOT = {
  sheets: SAMPLE_SHEETS,
  clientsData: SAMPLE_CLIENTS,
  pricesList: [],   // will be filled at import time from current defaults
  myCompanyDetails: {
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
      'מכירה והתקנת כל סוגי המזגנים',
    ],
    serviceLines: [
      'תכנון וביצוע מערכות מיזוג אוויר ואוורור * פינוי עשן * ייצור תעלות פח',
      'צינורות "ספיראל" ואביזרים * תעלות נירוסטה ומנדפים * תעלות',
      'פח שחור * חיתוך וכיפוף פחים * מכירה והתקנת כל סוגי המזגנים',
    ],
  },
  projectDocNumbers: SAMPLE_DOC_NUMBERS,
  projectDocDates: SAMPLE_DOC_DATES,
  selectedClient: 'אלקטרה מיזוג אוויר',
  selectedProject: 'מגדלי עזריאלי קומה 4',
};
