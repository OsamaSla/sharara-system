// ─── Types ───
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

export interface ClientDetails {
  name: string;
  phone: string;
  email: string;
  contact: string;
  regDate?: string;
}

export interface CompanyDetails {
  name: string;
  engName: string;
  subtitle: string;
  website: string;
  email: string;
  address: string;
  phone: string;
  fax: string;
  mobile: string;
  pobox: string;
  services: string[];
  serviceLines: string[];
}

export interface ClientsData {
  [key: string]: {
    phone: string;
    email: string;
    contact: string;
    regDate: string;
    projects: string[];
  };
}

export type TabId = 'measure' | 'summary' | 'invoice' | 'pricelist' | 'production';

export interface ExportOptions {
  sheets: Sheet[];
  clientName: string;
  projectName: string;
  docDate: string;
  docNumber: string;
  companyLogo: string | null;
  pricesList: PriceItem[];
  activeSheetId?: string;
  invoicePriceOverrides?: Record<string, number>;
}

export type FormulaConfig = Record<string, string>;
