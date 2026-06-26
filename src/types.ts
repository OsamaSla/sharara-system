// ─── Types ───
export type ConnectionType = 'ללא' | 'פלאנץ\' 20' | 'פלאנץ\' 30' | 'שיכטה' | 'פיטסבורג';

export interface ProductionConfig {
  slikAllowance: number;
  pittsburghAllowance: number;
  vNotchDepth: number;
  flange20: number;
  flange30: number;
}

export const CONNECTION_TYPE_MAP: Record<ConnectionType, number> = {
  'ללא': 0,
  'פלאנץ\' 20': 20,
  'פלאנץ\' 30': 30,
  'שיכטה': 12,
  'פיטסבורג': 12,
};

export interface RowData {
  id: string;
  partNumber: string;
  type: 'קטע ישר' | 'קשת' | 'מעבר' | 'שתוצר' | 'מתאם' | 'שרשורי' | 'חיבור גמיש';
  panels: number;
  dofan: number;
  width1: number;
  height1: number;
  width2: number;
  height2: number;
  length: number;
  rBig: number;
  rSmall: number;
  shatuzar: boolean;
  flexible: number;
  acoustic: boolean;
  external: boolean;
  sharshuriType: 'ללא' | '"4' | '"6' | '"8' | '"10' | '"12' | '"14';
  sharshuriLen: number;
  adapterType: 'ללא' | '"6 מתאם' | '8/8 מתאם' | '10/10 מתאם' | '12/12 מתאם' | '14/14 מתאם' | '16/16 מתאם' | '60/60 מתאם';
  adapterQty: number;
  notes: string;
  manualThickness: number;
  rBig2: number;
  connectionType: ConnectionType;
  productionMode: 'automatic' | 'manual';
  productionOverrides: {
    width1?: number;
    height1?: number;
    width2?: number;
    height2?: number;
    length?: number;
    rSmall?: number;
    rBig?: number;
    thickness?: number;
  };
}

export interface Sheet {
  id: string;
  name: string;
  rows: RowData[];
}

export interface PriceItem {
  id: string;
  detail: string;
  unit: string;
  price: number;
}

export type FormulaConfig = Record<string, string>;
