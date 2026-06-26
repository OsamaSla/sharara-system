import type { FormulaConfig, ProductionConfig } from './types';

// ──────────────────────────────────────────────
// נתוני ברירת מחדל — לקוחות
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

// ──────────────────────────────────────────────
// נתוני ברירת מחדל — הגדרות ייצור
// ──────────────────────────────────────────────

export const DEFAULT_PRODUCTION_CONFIG: ProductionConfig = {
  slikAllowance: 12,
  pittsburghAllowance: 12,
  vNotchDepth: 7,
  flange20: 20,
  flange30: 30,
};
